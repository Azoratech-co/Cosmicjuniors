"""Analytic checks for the scientific asset-preparation step (numpy + Pillow)."""
import importlib.util, pathlib, sys, unittest
import numpy as np
sys.dont_write_bytecode = True

path=pathlib.Path(__file__).resolve().parents[1]/'scripts/prepare-globe-surfaces.py'
spec=importlib.util.spec_from_file_location('prepare_surface',path)
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)

class Normals(unittest.TestCase):
 def test_level_surface_matches_the_sphere_axes(self):
  width=360;normal=np.asarray(module.object_normals(np.zeros((180,360),dtype=np.float32),1737400,width))
  for row,col in [(89,179),(89,269),(44,179),(134,89)]:
   lat=np.radians(90-(row+.5));lon=np.radians(-180+(col+.5))
   expected=np.array([np.cos(lat)*np.cos(lon),np.sin(lat),-np.cos(lat)*np.sin(lon)])
   actual=normal[row,col].astype(float)/255*2-1
   self.assertLess(np.linalg.norm(actual-expected),0.008)

 def test_east_rising_terrain_tilts_the_normal_west(self):
  # At 0E/0N, east is negative Z. A surface rising east tilts toward positive Z.
  height=np.tile(np.linspace(-40000,40000,360,dtype=np.float32),(180,1))
  normal=np.asarray(module.object_normals(height,1737400,360))
  actual=normal[89,180].astype(float)/255*2-1
  lon=np.radians(.5);radial_z=-np.sin(lon)*np.cos(np.radians(.5))
  self.assertGreater(actual[2],radial_z+0.003)

 def test_north_rising_terrain_tilts_the_normal_south(self):
  height=np.tile(np.linspace(40000,-40000,180,dtype=np.float32)[:,None],(1,360))
  normal=np.asarray(module.object_normals(height,1737400,360))
  actual=normal[89,180].astype(float)/255*2-1
  self.assertLess(actual[1],np.sin(np.radians(.5))-0.008)

if __name__=='__main__':unittest.main()
