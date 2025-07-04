import React from 'react';
import {
	AbsoluteFill,
	useCurrentFrame,
	interpolate,
	spring,
	useVideoConfig,
	Audio,
	Img,
	Sequence,
	Easing,
} from 'remotion';
import type { LyricsProps } from '../schema';

// Minimal color palette with semantic naming
const DEFAULT_COLORS = {
	primary: '#2563eb',
	onPrimary: '#ffffff',
	primaryContainer: '#f1f5f9',
	secondary: '#64748b',
	onSecondary: '#ffffff',
	secondaryContainer: '#f8fafc',
	tertiary: '#0f172a',
	onTertiary: '#ffffff',
	tertiaryContainer: '#f8fafc',
	background: '#ffffff',
	surface: '#ffffff',
	surfaceVariant: '#f8fafc',
	outline: '#e2e8f0',
	onBackground: '#0f172a',
	onSurface: '#1e293b',
	onSurfaceVariant: '#475569',
	error: '#dc2626',
};

// Clean text reveal animation
const RevealText: React.FC<{
	text: string;
	delay: number;
	fontSize: string;
	fontWeight: number;
	color: string;
}> = ({ text, delay, fontSize, fontWeight, color }) => {
	const frame = useCurrentFrame();
	
	// Elegant slide-up animation
	const reveal = spring({
		frame: frame - delay,
		fps: 30,
		config: {
			damping: 25,
			mass: 0.8,
			stiffness: 120,
		},
	});

	const opacity = interpolate(reveal, [0, 1], [0, 1]);
	const translateY = interpolate(reveal, [0, 1], [30, 0]);

	return (
		<span
			style={{
				display: 'inline-block',
				fontSize,
				fontWeight,
				color,
				opacity,
				transform: `translateY(${translateY}px)`,
                lineHeight: 1.2,
                width: '80vh',
			}}
		>
			{text}
		</span>
	);
};

const MinimalZen: React.FC<LyricsProps> = ({
	lyrics,
	fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
	backgroundColor = 'var(--background)',
	textColor = 'var(--foreground)',
	backgroundImage,
	audioSrc,
	theme,
}) => {
	const frame = useCurrentFrame();
	const { fps, width, height } = useVideoConfig();

	const aspectRatio = width / height;
	const isVertical = aspectRatio < 1;

	const colors = React.useMemo(() => {
		if (!theme) return DEFAULT_COLORS;

		// For minimal theme, prefer high contrast
		return {
			primary: theme.light.primary || theme.dark.primary,
			onPrimary: theme.light.onPrimary || theme.dark.onPrimary,
			primaryContainer: theme.light.primaryContainer || theme.dark.primaryContainer,
			secondary: theme.light.secondary || theme.dark.secondary,
			onSecondary: theme.light.onSecondary || theme.dark.onSecondary,
			secondaryContainer: theme.light.secondaryContainer || theme.dark.secondaryContainer,
			tertiary: theme.light.tertiary || theme.dark.tertiary,
			onTertiary: theme.light.onTertiary || theme.dark.onTertiary,
			tertiaryContainer: theme.light.tertiaryContainer || theme.dark.tertiaryContainer,
			background: theme.light.background || '#ffffff',
			surface: theme.light.surface || '#ffffff',
			surfaceVariant: theme.light.surfaceVariant || '#f8fafc',
			outline: theme.light.outline || '#e2e8f0',
			onBackground: theme.light.onBackground || '#0f172a',
			onSurface: theme.light.onSurface || '#1e293b',
			onSurfaceVariant: theme.light.onSurfaceVariant || '#475569',
			error: theme.light.error || theme.dark.error,
		};
	}, [theme]);

	const dynBackgroundColor = theme ? colors.background : backgroundColor;
	const dynTextColor = theme ? colors.onSurface : textColor;

	const currentLyricIndex = lyrics.findIndex(
		(l) => frame >= l.startFrame && frame <= l.endFrame
	);

	// Responsive styles with emphasis on whitespace
	const getResponsiveStyles = () => {
		if (isVertical) {
			return {
				currentLyric: {
					fontSize: '2.5rem',
					padding: '2rem',
					maxWidth: '85%',
					top: '50%',
					letterSpacing: '-0.02em',
				},
				nextLyric: {
					fontSize: '1.25rem',
					bottom: '15%',
					width: '80%',
					padding: '1rem',
					letterSpacing: '0em',
				},
			};
		} else {
			return {
				currentLyric: {
					fontSize: '3.5rem',
					padding: '3rem 4rem',
					maxWidth: '70%',
					top: '50%',
					letterSpacing: '-0.03em',
				},
				nextLyric: {
					fontSize: '1.5rem',
					bottom: '10%',
					width: '60%',
					padding: '1.5rem',
					letterSpacing: '0em',
				},
			};
		}
	};

	const responsiveStyles = getResponsiveStyles();

	const renderLyrics = () => {
		if (currentLyricIndex === -1) return null;

		const currentLyric = lyrics[currentLyricIndex];
		const nextLyric = lyrics[currentLyricIndex + 1];

		// Clean entrance animation
		const entrance = spring({
			frame: frame - currentLyric.startFrame,
			fps,
			config: {
				damping: 20,
				mass: 1,
				stiffness: 100,
			},
		});

		// Smooth fade timing
		const progress = (frame - currentLyric.startFrame) / (currentLyric.endFrame - currentLyric.startFrame);
		const fadeOut = progress > 0.9 
			? interpolate(progress, [0.9, 1], [1, 0], {
				easing: Easing.bezier(0.4, 0, 0.2, 1),
			})
			: 1;

		const opacity = entrance * fadeOut;
		const scale = interpolate(entrance, [0, 1], [0.95, 1]);
		const translateY = interpolate(entrance, [0, 1], [20, 0]);

		// Subtle breathing effect
        const breathe = interpolate(
            Math.sin(frame / 120),
            [-1, 1],
            [0.99, 1.01]
        );

		return (
			<>
				{/* Current lyric with minimal styling */}
				<div
					style={{
						position: 'absolute',
						opacity,
						left: '50%',
						top: responsiveStyles.currentLyric.top,
						transform: `
							translate(-50%, -50%) 
							translateY(${translateY}px) 
							scale(${scale * breathe})
						`,
						textAlign: 'center',
                        zIndex: 10,
					}}
				>
					<div
						style={{
							fontSize: responsiveStyles.currentLyric.fontSize,
							fontWeight: 600,
							lineHeight: 1.1,
							color: dynTextColor,
							letterSpacing: responsiveStyles.currentLyric.letterSpacing,
							padding: responsiveStyles.currentLyric.padding,
                            position: 'relative',
						}}
					>
						
						<RevealText
							text={currentLyric.text}
							delay={currentLyric.startFrame}
							fontSize={responsiveStyles.currentLyric.fontSize}
							fontWeight={600}
							color={dynTextColor}
						/>
					</div>
				</div>

				{/* Next lyric with preview styling */}
				{nextLyric && (
					<div
						style={{
							position: 'absolute',
							opacity: 0.4,
							bottom: responsiveStyles.nextLyric.bottom,
							left: '50%',
							transform: 'translateX(-50%)',
							textAlign: 'center',
                            zIndex: 5,
						}}
					>
						<div
							style={{
								fontSize: responsiveStyles.nextLyric.fontSize,
								fontWeight: 400,
								lineHeight: 1.3,
								color: dynTextColor,
								letterSpacing: responsiveStyles.nextLyric.letterSpacing,
								padding: responsiveStyles.nextLyric.padding,
								maxWidth: isVertical ? '320px' : '600px',
								borderTop: `1px solid ${colors.outline}`,
                                paddingTop: '1rem',
                                textAlign: 'center',
							}}
						>
							{nextLyric.text}
						</div>
					</div>
				)}
			</>
		);
	};

	if (theme === null) {
		return <AbsoluteFill style={{ backgroundColor: backgroundColor }} />;
	}

	return (
		<AbsoluteFill
			style={{
				backgroundColor: dynBackgroundColor,
				fontFamily,
				overflow: 'hidden',
			}}
		>
			{/* Background image with minimal treatment */}
			{backgroundImage && (
				<div
					style={{
						position: 'absolute',
						width: '100%',
						height: '100%',
						opacity: 0.1,
					}}
				>
					<Sequence premountFor={100}>
						<Img
							src={backgroundImage}
							alt="Background"
							style={{
								width: '100%',
								height: '100%',
								objectFit: 'cover',
								objectPosition: 'top center',
								filter: 'grayscale(100%) contrast(0.3)',
							}}
							pauseWhenLoading
							onError={console.error}
						/>
					</Sequence>
				</div>
			)}
			{/* Clean gradient overlay */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background: `linear-gradient(135deg, ${colors.background}95, ${colors.surfaceVariant}90)`,
                    opacity: 0.02,
				}}
			/>

			{renderLyrics()}
			{audioSrc && <Audio src={audioSrc} />}
		</AbsoluteFill>
	);
};

export default MinimalZen;
