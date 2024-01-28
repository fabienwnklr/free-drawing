import { DrawerOptions } from './@types/drawer';

export const defaultOptions: DrawerOptions = {
  tool: 'brush',
  width: window.innerWidth * 0.8,
  height: window.innerHeight * 0.8,
  strokeWidth: 5,
  strokeColor: '#df4b26',
  zoom: true,
  zoomWidget: true,
  scaling: 1.11
};
