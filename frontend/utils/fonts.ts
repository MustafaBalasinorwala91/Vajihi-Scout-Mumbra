import { PixelRatio, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const rf = (size: number) => {
    const scale = width / 375;

    const newSize = size * scale;

    return Math.round(
        PixelRatio.roundToNearestPixel(newSize)
    );
};