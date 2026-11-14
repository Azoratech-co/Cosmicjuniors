#!/usr/bin/env python3
"""Prepare NASA globe surfaces. Requires numpy and Pillow, not website dependencies.

python scripts/prepare-globe-surfaces.py --cache /path/to/source-cache --snapshot YYYY-MM-DD
Use an empty cache to retrieve a new snapshot. All inputs/tiles are byte-hashed.
"""
import argparse, concurrent.futures, datetime, hashlib, io, json, pathlib, urllib.request, xml.etree.ElementTree as ET
import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[1]
MOON = 'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/'
MOLA = 'https://pds-geosciences.wustl.edu/mgs/urn-nasa-pds-mgs_mola_topography_derived/meg016/'
WMTS = 'https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/'
RADIUS = {'moon':1737400.0, 'mars':3396190.0}

def sha(blob): return hashlib.sha256(blob).hexdigest()

def retrieve(cache, name, url):
    dest = cache/name
    if not dest.exists():
        dest.parent.mkdir(parents=True,exist_ok=True)
        temp = dest.with_suffix(dest.suffix+'.download')
        with urllib.request.urlopen(url,timeout=50) as response, temp.open('wb') as out:
            while chunk := response.read(1024*1024): out.write(chunk)
        temp.replace(dest)
    blob = dest.read_bytes()
    return blob, {'url':url,'bytes':len(blob),'sha256':sha(blob)}

def resized(values, size):
    return np.asarray(Image.fromarray(values.astype(np.float32)).resize(size, Image.Resampling.BILINEAR),dtype=np.float32)

def object_normals(height, radius, width):
    """Physical, planet-fixed normals, matching SphereGeometry and east-positive longitude.
    dR/distance is dimensionless. No artificial relief multiplier is applied.
    Object-space maps avoid adding the same slope to displaced mesh normals twice.
    """
    h = resized(height,(width,width//2)); rows,cols = h.shape
    delta = 2*np.pi/cols
    lat = (np.pi/2-(np.arange(rows,dtype=np.float32)+.5)*np.pi/rows)[:,None]
    lon = (-np.pi+(np.arange(cols,dtype=np.float32)+.5)*delta)[None,:]
    rr = radius+h
    east = (np.roll(h,-1,axis=1)-np.roll(h,1,axis=1))/(2*delta*rr*np.cos(lat))
    north = -np.gradient(h,np.pi/rows,axis=0)/rr
    result = np.empty((rows,cols,3),dtype=np.uint8)
    for start in range(0,rows,128):
        stop = min(rows,start+128); a=lat[start:stop]; e=east[start:stop]; n=north[start:stop]
        x = np.cos(a)*np.cos(lon)+e*np.sin(lon)+n*np.sin(a)*np.cos(lon)
        y = np.sin(a)-n*np.cos(a)+np.zeros_like(x)
        z = -np.cos(a)*np.sin(lon)+e*np.cos(lon)-n*np.sin(a)*np.sin(lon)
        normal = np.stack([x,y,z],axis=2); normal /= np.linalg.norm(normal,axis=2,keepdims=True)
        result[start:stop] = np.rint(np.clip(normal*.5+.5,0,1)*255).astype(np.uint8)
    return Image.fromarray(result)

def mars_color(cache):
    raw,cap_source = retrieve(cache,'mars-color-capabilities.xml',WMTS+'WMTSCapabilities.xml')
    ns={'w':'http://www.opengis.net/wmts/1.0','o':'http://www.opengis.net/ows/1.1'}
    root=ET.fromstring(raw)
    matrix=next(m for m in root.findall('.//w:TileMatrix',ns) if m.find('o:Identifier',ns).text=='4')
    assert matrix.find('w:TopLeftCorner',ns).text=='-180.0 90.0'
    assert int(float(matrix.find('w:MatrixWidth',ns).text))==32
    assert int(float(matrix.find('w:MatrixHeight',ns).text))==16
    assert matrix.find('w:TileWidth',ns).text=='256'
    image=Image.new('RGB',(8192,4096)); inputs=[]
    def tile(rc):
        row,col=rc;url=f'{WMTS}default/default028mm/4/{row}/{col}.jpg'
        blob,meta=retrieve(cache,f'mars-tiles/4-{row}-{col}.jpg',url)
        im=Image.open(io.BytesIO(blob)).convert('RGB'); assert im.size==(256,256)
        return row,col,im,meta
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for i,(row,col,im,meta) in enumerate(pool.map(tile,[(r,c) for r in range(16) for c in range(32)])):
            image.paste(im,(col*256,row*256)); inputs.append(meta)
            if (i+1)%64==0: print('NASA Mars color tiles',i+1,'/512',flush=True)
    return image,[cap_source],inputs

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--cache',type=pathlib.Path,required=True);p.add_argument('--snapshot',required=True)
    args=p.parse_args();datetime.date.fromisoformat(args.snapshot);args.cache.mkdir(parents=True,exist_ok=True)
    for world in ['moon','mars']:
        sources=[];tiles=[]
        if world=='moon':
            _,meta=retrieve(args.cache,'moon-color-8k.tif',MOON+'lroc_color_16bit_srgb_8k.tif');sources.append(meta)
            color=Image.open(args.cache/'moon-color-8k.tif').convert('RGB')
            _,meta=retrieve(args.cache,'moon-dem.tif',MOON+'ldem_16_uint.tif');sources.append(meta)
            dem=np.asarray(Image.open(args.cache/'moon-dem.tif'),dtype=np.float32)
            assert dem.shape==(2880,5760)
            height=dem*.5-10000.0
            credit="NASA's Scientific Visualization Studio / LRO LROC and LOLA teams"
            reference='https://svs.gsfc.nasa.gov/4720/'
            method='2025 sRGB color map converted to 8-bit sRGB WebP. LOLA unsigned half-meter heights decoded as value*0.5-10000 meters relative to 1737400 meters. Polar color is lower-resolution laser albedo fill; this is a visualization, not a scientific albedo product.'
        else:
            color,sources,tiles=mars_color(args.cache)
            raw,meta=retrieve(args.cache,'mars-radius.img',MOLA+'megr90n000eb.img');sources.append(meta)
            label,meta=retrieve(args.cache,'mars-radius.lbl',MOLA+'megr90n000eb.lbl');sources.append(meta)
            _,meta=retrieve(args.cache,'mars-radius.xml',MOLA+'megr90n000eb.xml');sources.append(meta)
            assert b'MSB_INTEGER' in label and b'3396000' in label and b'SAMPLE_BITS' in label
            radius=np.frombuffer(raw,dtype='>i2').astype(np.float32).reshape(2880,5760)+3396000.0
            # MOLA starts at 0E; color and our UVs start at -180E.
            height=np.roll(radius-RADIUS['mars'],2880,axis=1)
            credit='NASA/JPL/USGS (Viking MDIM 2.1) / NASA GSFC MGS MOLA team / NASA PDS Geosciences Node'
            reference='https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars'
            method='NASA Trek MDIM 2.1 matrix-4 tiles assembled without changing geographic extent. MOLA planetary radii decoded as signed big-endian integer meters +3396000, not topography relative to the areoid. The 0..360E radius raster is shifted to -180..180E. Missing observational bins are interpolated in the original product.'
        assert color.size==(8192,4096)
        assert np.isfinite(height).all() and height.min()>-40000 and height.max()<40000
        out=ROOT/f'public/models/{world}/surface';out.mkdir(parents=True,exist_ok=True);files=[]
        def record(path,width=None,height_px=None):
            data=path.read_bytes();entry={'file':path.name,'bytes':len(data),'sha256':sha(data)}
            if width:entry.update(width=width,height=height_px)
            files.append(entry)
        for width in [2048,4096,8192]:
            image=color if width==8192 else color.resize((width,width//2),Image.Resampling.LANCZOS)
            path=out/f'color-{width}.webp';image.save(path,quality=94,method=5);record(path,width,width//2)
        color.close()
        for width in [2048,4096]:
            image=object_normals(height,RADIUS[world],width);path=out/f'normals-{width}.webp'
            image.save(path,lossless=True,method=5);record(path,width,width//2)
        grid=resized(height,(512,256)).astype('<f4');path=out/'shape-512.f32';path.write_bytes(grid.tobytes());record(path,512,256)
        meta={'schemaVersion':1,'world':world,'snapshotDate':args.snapshot,'credit':credit,'reference':reference,
              'elevationReference':'https://svs.gsfc.nasa.gov/4720/' if world=='moon' else 'https://pds-geosciences.wustl.edu/missions/mgs/megdr.html',
              'referenceRadiusMeters':RADIUS[world],'extent':[-180,-90,180,90],'pixelRegistration':'cell centers; north row first; east-positive longitude',
              'shape':{'file':'shape-512.f32','width':512,'height':256,'encoding':'little-endian float32 meters relative to referenceRadiusMeters'},
              'normals':'Object-space RGB maps in the same X/Y/Z axes as the globe. Slopes use the measured radius and angular pixel spacing. Physical relief scale 1. No synthetic detail or height exaggeration.',
              'method':method,'files':files,'sources':sources,'tiles':tiles}
        (out/'sources.json').write_text(json.dumps(meta,indent=2)+'\n')
        print(world,'shape height range',float(height.min()),float(height.max()),'meters;',sum(f['bytes'] for f in files),'bundled bytes',flush=True)

if __name__=='__main__':main()
