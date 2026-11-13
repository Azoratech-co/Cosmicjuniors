#!/usr/bin/env python3
"""Prepare dated NASA route snapshots. Python 3 standard library only.

Usage: python scripts/prepare-mars-journeys.py --snapshot YYYY-MM-DD [--cache DIR]
Source files are retained in the chosen cache for provenance/reproducibility.
No live position request is made by the website. Re-run and review to refresh.
"""
import argparse, datetime, hashlib, io, json, math, pathlib, struct, urllib.request, zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
BASE = 'https://an.rsl.wustl.edu/mera/AN/meri/MER/traverse/'
SOURCES = {
 'spirit': [('MERA_traverse.zip', BASE+'MERA_traverse.zip'), ('MERA_traverse.lbl', BASE+'MERA_traverse.lbl')],
 'opportunity': [('MERB_traverse_5130.zip', BASE+'MERB_traverse_5130.zip'), ('MERB_traverse_5130.lbl', BASE+'MERB_traverse_5130.lbl')],
 'curiosity': [('MSL_traverse.json','https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_traverse.json'), ('MSL_waypoints.json','https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints.json')],
 'perseverance': [('M20_traverse.json','https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_traverse.json'), ('M20_waypoints.json','https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json')],
}
MEDIA = {
 'sojourner-map.jpg': ('https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia01/pia01238/PIA01238.jpg', 'NASA/JPL', 'https://science.nasa.gov/photojournal/mars-pathfinder-rover-traverse-image/'),
 'zhurong-tracks.jpg': ('https://static.uahirise.org/images/2022/details/cut/ESP_073225_2055-cut-1.jpg', 'NASA/JPL-Caltech/UArizona', 'https://www.uahirise.org/ESP_073225_2055'),
 'zhurong-last.jpg': ('https://static.uahirise.org/images/2023/details/cut/ESP_077511_2055.jpg', 'NASA/JPL-Caltech/UArizona', 'https://hirise.lpl.arizona.edu/ESP_077511_2055'),
}

def coordinate(point):
 lon,lat = point[:2]
 assert math.isfinite(lon) and math.isfinite(lat) and -90 <= lat <= 90
 return [round(lon % 360,8),round(lat,8)]

def lines_from_shp(blob):
 assert struct.unpack_from('<i',blob,32)[0] == 3, 'Expected PolyLine shapefile'
 offset=100; result=[]
 while offset < len(blob):
  _,words=struct.unpack_from('>2i',blob,offset);record=blob[offset+8:offset+8+words*2]
  kind=struct.unpack_from('<i',record)[0]
  if kind == 3:
   parts,count=struct.unpack_from('<2i',record,36)
   starts=list(struct.unpack_from('<'+'i'*parts,record,44))+[count]
   points=[struct.unpack_from('<2d',record,44+4*parts+16*i) for i in range(count)]
   for i in range(parts):result.append(points[starts[i]:starts[i+1]])
  else: assert kind == 0, 'Unexpected shape type'
  offset += 8+words*2
 return result

def rows_from_dbf(blob):
 count,header,size=struct.unpack_from('<IHH',blob,4);fields=[]
 for offset in range(32,header-1,32):
  if blob[offset] == 13:break
  fields.append((blob[offset:offset+11].split(b'\0')[0].decode(),blob[offset+16]))
 rows=[]
 for i in range(count):
  raw=blob[header+i*size:header+(i+1)*size]
  if raw[:1] == b'*':continue
  cursor=1;row={}
  for name,width in fields:
   row[name]=raw[cursor:cursor+width].decode().strip();cursor+=width
  rows.append(row)
 return rows

def compress_lines(lines):
 """Remove duplicate coordinates; join only EXACTLY matching segment ends.
 Never bridge a gap, fit a spline, or substitute planned route geometry.
 """
 result=[]
 for line in lines:
  clean=[]
  for point in line:
   point=coordinate(point)
   if not clean or point != clean[-1]:clean.append(point)
  if len(clean)<2:continue
  if result and result[-1][-1] == clean[0]:result[-1].extend(clean[1:])
  else:result.append(clean)
 return result

def distance_m(a,b):
 lat1,lat2=math.radians(a[1]),math.radians(b[1]);dl=math.radians(b[0]-a[0]);dp=lat2-lat1
 return 2*3396190*math.asin(min(1,math.sqrt(math.sin(dp/2)**2+math.cos(lat1)*math.cos(lat2)*math.sin(dl/2)**2)))

def prepare(rover,blobs,snapshot):
 if rover in ['spirit','opportunity']:
  with zipfile.ZipFile(io.BytesIO(blobs[0])) as z:
   shp=z.read(next(n for n in z.namelist() if n.lower().endswith('.shp')))
   dbf=z.read(next(n for n in z.namelist() if n.lower().endswith('.dbf')))
   prj=z.read(next(n for n in z.namelist() if n.lower().endswith('.prj'))).decode().strip()
  rows=rows_from_dbf(dbf);raw_lines=lines_from_shp(shp)
  assert len(rows)==len(raw_lines)
  stops=[coordinate([float(row['LON']),float(row['LAT'])])+[int(row['START_SOL']),int(row['END_SOL']),row['SITE'],row['DRIVE']] for row in rows]
  provider="NASA PDS Geosciences Analyst's Notebook supplemental corrected traverse (Tim Parker / June Wang)"
  note="Corrected positions include science-team control points and interpolation between them. Label identifies a supplemental product, not a formally archived PDS dataset. Original history landing coordinates may differ from map-localized origins."
 else:
  path=json.loads(blobs[0]);waypoints=json.loads(blobs[1]);rows=waypoints['features'];raw_lines=[]
  for f in path['features']:
   kind=f['geometry']['type'];coords=f['geometry']['coordinates']
   assert kind in ['LineString','MultiLineString']
   raw_lines.extend([coords] if kind=='LineString' else coords)
  stops=[coordinate(f['geometry']['coordinates'])+[int(f['properties']['sol']),int(f['properties']['sol']),str(f['properties']['site']),str(f['properties']['drive'])] for f in rows]
  provider='NASA/JPL MMGIS published rover traverse and waypoint layers'
  prj='East-positive longitude, north-positive planetocentric latitude as published by NASA MMGIS; elevation omitted for the surface display.'
  note='Route and waypoint layers are independent publications; segment boundaries and gaps are preserved. This dated snapshot is not live telemetry.'
 # Preserve source RMC order. Opportunity contains one same-position sol-order
 # inversion (2170 -> 2169); silently sorting would change source topology.
 assert stops and all(s[2] <= s[3] for s in stops)
 segments=compress_lines(raw_lines);assert segments
 assert distance_m(stops[-1],segments[-1][-1])<50, 'Stop/path endpoints disagree; inspect publication timing before refreshing'
 sources=[{'url':url,'sha256':hashlib.sha256(blob).hexdigest(),'bytes':len(blob)} for (_,url),blob in zip(SOURCES[rover],blobs)]
 data={'schemaVersion':1,'roverId':rover,'snapshotDate':snapshot,'provider':provider,'frame':prj,'method':note,'sources':sources,'stopColumns':['longitudeE','latitudeN','startSol','endSol','site','drive'],'stops':stops,'segments':segments}
 info={'file':f'/models/mars/routes/{rover}.json','snapshotDate':snapshot,'stopCount':len(stops),'segmentCount':len(segments),'coordinateCount':sum(len(s) for s in segments),'first':stops[0],'last':stops[-1],'maxRecordedSol':max(s[3] for s in stops),'sources':sources}
 return data,info

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--snapshot',required=True);p.add_argument('--cache',type=pathlib.Path,default=ROOT/'work'/'route-sources');args=p.parse_args()
 datetime.date.fromisoformat(args.snapshot);args.cache.mkdir(parents=True,exist_ok=True)
 out=ROOT/'public/models/mars/routes';out.mkdir(parents=True,exist_ok=True);index={}
 for rover,files in SOURCES.items():
  blobs=[]
  for filename,url in files:
   cached=args.cache/filename
   if not cached.exists():
    with urllib.request.urlopen(url,timeout=45) as response:cached.write_bytes(response.read())
   blobs.append(cached.read_bytes())
  data,info=prepare(rover,blobs,args.snapshot)
  (out/f'{rover}.json').write_text(json.dumps(data,separators=(',',':'))+'\n');index[rover]=info
  print(rover,info['stopCount'],'localizations,',info['coordinateCount'],'route vertices; end',info['last'])
 dest=ROOT/'lib/data/mars-journey-index.json';dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(json.dumps(index,indent=2)+'\n')
 media=[]
 for filename,(url,credit,page) in MEDIA.items():
  cached=args.cache/filename
  if not cached.exists():
   with urllib.request.urlopen(url,timeout=45) as response:cached.write_bytes(response.read())
  blob=cached.read_bytes();(out/filename).write_bytes(blob)
  media.append({'file':filename,'source':url,'reference':page,'credit':credit,'snapshotDate':args.snapshot,'bytes':len(blob),'sha256':hashlib.sha256(blob).hexdigest(),'preparation':'Unmodified original NASA/mission-team JPEG; no pixel coordinates inferred.'})
 (out/'media-sources.json').write_text(json.dumps(media,indent=2)+'\n')

if __name__=='__main__':main()
