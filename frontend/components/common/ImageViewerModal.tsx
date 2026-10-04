import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    PanResponder,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ImageViewerModalProps = {
    visible: boolean;
    images: string[];
    initialIndex?: number;
    onClose: () => void;
    title?: string;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MIN_SCALE = 1;
const MAX_SCALE = 4;

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

export default function ImageViewerModal({
    visible,
    images,
    initialIndex = 0,
    onClose,
    title = 'Image Preview',
}: ImageViewerModalProps) {
    const [index, setIndex] = useState(
        clamp(initialIndex, 0, Math.max(images.length - 1, 0))
    );
    const [zoomPercent, setZoomPercent] = useState(100);

    const scale = useRef(new Animated.Value(1)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;

    const scaleRef = useRef(1);
    const translateRef = useRef({ x: 0, y: 0 });
    const pinchStartDistance = useRef<number | null>(null);
    const pinchStartScale = useRef(1);
    const panStart = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (!visible) return;

        const nextIndex = clamp(
            initialIndex,
            0,
            Math.max(images.length - 1, 0)
        );

        setIndex(nextIndex);
        scaleRef.current = 1;
        setZoomPercent(100);
        translateRef.current = { x: 0, y: 0 };
        pinchStartDistance.current = null;
        pinchStartScale.current = 1;

        scale.setValue(1);
        translateX.setValue(0);
        translateY.setValue(0);
    }, [visible, initialIndex, images.length, scale, translateX, translateY]);

    const resetTransform = () => {
        scaleRef.current = 1;
        setZoomPercent(100);
        translateRef.current = { x: 0, y: 0 };
        pinchStartDistance.current = null;
        pinchStartScale.current = 1;

        Animated.parallel([
            Animated.spring(scale, {
                toValue: 1,
                useNativeDriver: false,
                friction: 7,
                tension: 70,
            }),
            Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: false,
                friction: 7,
                tension: 70,
            }),
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: false,
                friction: 7,
                tension: 70,
            }),
        ]).start();
    };

    const setZoom = (nextScale: number) => {
        const value = clamp(nextScale, MIN_SCALE, MAX_SCALE);
        scaleRef.current = value;
        setZoomPercent(Math.round(value * 100));

        if (value === 1) {
            translateRef.current = { x: 0, y: 0 };
            Animated.parallel([
                Animated.spring(scale, {
                    toValue: 1,
                    useNativeDriver: false,
                    friction: 7,
                    tension: 70,
                }),
                Animated.spring(translateX, {
                    toValue: 0,
                    useNativeDriver: false,
                    friction: 7,
                    tension: 70,
                }),
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: false,
                    friction: 7,
                    tension: 70,
                }),
            ]).start();
            return;
        }

        Animated.spring(scale, {
            toValue: value,
            useNativeDriver: false,
            friction: 7,
            tension: 70,
        }).start();
    };

    const getDistance = (touches: readonly any[]) => {
        if (!touches || touches.length < 2) return null;
        const a = touches[0];
        const b = touches[1];

        return Math.sqrt(
            Math.pow(a.pageX - b.pageX, 2) +
            Math.pow(a.pageY - b.pageY, 2)
        );
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,

            onPanResponderGrant: (event, gestureState) => {
                const touches = event.nativeEvent.touches;

                if (touches.length >= 2) {
                    const distance = getDistance(touches);
                    if (distance) {
                        pinchStartDistance.current = distance;
                        pinchStartScale.current = scaleRef.current;
                    }
                    return;
                }

                panStart.current = {
                    x: translateRef.current.x,
                    y: translateRef.current.y,
                };
            },

            onPanResponderMove: (event, gestureState) => {
                const touches = event.nativeEvent.touches;

                if (touches.length >= 2) {
                    const distance = getDistance(touches);

                    if (
                        distance &&
                        pinchStartDistance.current &&
                        pinchStartDistance.current > 0
                    ) {
                        const nextScale = clamp(
                            pinchStartScale.current *
                            (distance / pinchStartDistance.current),
                            MIN_SCALE,
                            MAX_SCALE
                        );

                        scaleRef.current = nextScale;
                        setZoomPercent(Math.round(nextScale * 100));
                        scale.setValue(nextScale);

                        if (nextScale === 1) {
                            translateRef.current = { x: 0, y: 0 };
                            translateX.setValue(0);
                            translateY.setValue(0);
                        }
                    }

                    return;
                }

                if (scaleRef.current <= 1) {
                    return;
                }

                const nextX = panStart.current.x + gestureState.dx;
                const nextY = panStart.current.y + gestureState.dy;

                translateRef.current = {
                    x: nextX,
                    y: nextY,
                };

                translateX.setValue(nextX);
                translateY.setValue(nextY);
            },

            onPanResponderRelease: (event) => {
                const touches = event.nativeEvent.touches;

                if (touches.length < 2) {
                    pinchStartDistance.current = null;
                    pinchStartScale.current = scaleRef.current;
                }

                if (scaleRef.current <= 1) {
                    translateRef.current = { x: 0, y: 0 };
                    translateX.setValue(0);
                    translateY.setValue(0);
                }
            },

            onPanResponderTerminate: () => {
                pinchStartDistance.current = null;
                pinchStartScale.current = scaleRef.current;
            },
        })
    ).current;

    const showPrevious = () => {
        if (images.length < 2) return;
        setIndex((current) => {
            const next = current === 0 ? images.length - 1 : current - 1;
            resetTransform();
            return next;
        });
    };

    const showNext = () => {
        if (images.length < 2) return;
        setIndex((current) => {
            const next = current === images.length - 1 ? 0 : current + 1;
            resetTransform();
            return next;
        });
    };

    if (!images.length) {
        return null;
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={styles.backdrop}>
                <View style={styles.topBar}>
                    <View style={styles.titleWrap}>
                        <Text style={styles.title} numberOfLines={1}>
                            {title}
                        </Text>
                        <Text style={styles.counter}>
                            {index + 1} / {images.length}
                        </Text>
                    </View>

                    <Pressable
                        style={styles.closeButton}
                        onPress={onClose}
                        hitSlop={10}
                    >
                        <Ionicons name="close" size={25} color="#fff" />
                    </Pressable>
                </View>

                <View style={styles.imageStage} {...panResponder.panHandlers}>
                    <Animated.Image
                        source={{ uri: images[index] }}
                        style={[
                            styles.fullImage,
                            {
                                transform: [
                                    { translateX },
                                    { translateY },
                                    { scale },
                                ],
                            },
                        ]}
                        resizeMode="contain"
                    />
                </View>

                {images.length > 1 && (
                    <View style={styles.navigationRow}>
                        <Pressable
                            style={styles.navigationButton}
                            onPress={showPrevious}
                            hitSlop={8}
                        >
                            <Ionicons name="chevron-back" size={30} color="#fff" />
                        </Pressable>

                        <Text style={styles.navigationText}>
                            Swipe / pinch to view • tap arrows for other photos
                        </Text>

                        <Pressable
                            style={styles.navigationButton}
                            onPress={showNext}
                            hitSlop={8}
                        >
                            <Ionicons name="chevron-forward" size={30} color="#fff" />
                        </Pressable>
                    </View>
                )}

                <View style={styles.zoomBar}>
                    <Pressable
                        style={styles.zoomButton}
                        onPress={() => setZoom(scaleRef.current - 0.5)}
                        hitSlop={6}
                    >
                        <Ionicons name="remove" size={23} color="#fff" />
                    </Pressable>

                    <Pressable
                        style={styles.zoomButton}
                        onPress={resetTransform}
                        hitSlop={6}
                    >
                        <Ionicons name="refresh-outline" size={20} color="#fff" />
                    </Pressable>

                    <Text style={styles.zoomText}>
                        {zoomPercent}%
                    </Text>

                    <Pressable
                        style={styles.zoomButton}
                        onPress={() => setZoom(scaleRef.current + 0.5)}
                        hitSlop={6}
                    >
                        <Ionicons name="add" size={23} color="#fff" />
                    </Pressable>
                </View>

                <Text style={styles.helpText}>
                    Pinch to zoom • drag while zoomed
                </Text>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.96)',
    },
    topBar: {
        minHeight: 72,
        paddingTop: 22,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    titleWrap: {
        flex: 1,
        paddingRight: 12,
    },
    title: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
    counter: {
        color: '#BDBDBD',
        fontSize: 11,
        marginTop: 2,
    },
    closeButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    imageStage: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        width: SCREEN_WIDTH,
    },
    fullImage: {
        width: SCREEN_WIDTH,
        height: Math.min(SCREEN_HEIGHT * 0.72, 620),
    },
    navigationRow: {
        minHeight: 54,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    navigationButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    navigationText: {
        flex: 1,
        textAlign: 'center',
        color: '#C9C9C9',
        fontSize: 10,
        marginHorizontal: 10,
    },
    zoomBar: {
        alignSelf: 'center',
        minWidth: 180,
        paddingHorizontal: 10,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.12)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    zoomButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    zoomText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '800',
        minWidth: 52,
        textAlign: 'center',
    },
    helpText: {
        color: '#8F8F8F',
        textAlign: 'center',
        fontSize: 10,
        paddingTop: 8,
        paddingBottom: 18,
    },
});
