// Expo's bundled asset types cover .ttf but not .otf (SFPro-Regular.otf)
declare module "*.otf" {
  const source: number;
  export default source;
}
