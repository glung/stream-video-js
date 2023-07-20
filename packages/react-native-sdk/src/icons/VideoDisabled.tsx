import React from 'react';
import { Svg, Path } from 'react-native-svg';

type Props = {
  color: string;
};

export const VideoDisabled = ({ color }: Props) => (
  <Svg viewBox="0 0 24 24">
    <Path
      d="M 22.1126 16.2238 L 19.1546 13.6686 V 8.37994 L 22.1126 5.82471 L 22.1127 5.82476 L 22.1205 5.81781 C 22.4413 5.53481 22.6269 5.49515 22.686 5.49515 C 22.8267 5.49515 22.8809 5.53948 22.9048 5.56519 C 22.9344 5.59687 23 5.69295 23 5.91262 V 16.1359 C 23 16.3556 22.9344 16.4517 22.9048 16.4833 C 22.8809 16.5091 22.8267 16.5534 22.686 16.5534 C 22.634 16.5534 22.4383 16.5111 22.1205 16.2307 L 22.1206 16.2307 L 22.1126 16.2238 Z M 13.4493 18 H 3.28502 C 2.41817 18 1.87542 17.7686 1.55341 17.4618 C 1.23884 17.162 1 16.6616 1 15.835 V 6.23301 C 1 5.4144 1.24841 4.88792 1.58386 4.5637 C 1.92432 4.23463 2.47262 4 3.28502 4 H 13.5266 C 14.3853 4 14.898 4.23821 15.1995 4.54532 C 15.5041 4.85542 15.7343 5.37926 15.7343 6.23301 V 15.767 C 15.7343 16.6029 15.4949 17.126 15.1733 17.4423 C 14.8492 17.7609 14.3088 18 13.4493 18 Z"
      fill={'none'}
      stroke={color}
      strokeWidth={2}
    />
    <Path
      d="M 5.79311 7.27924 C 5.38794 6.90692 4.73102 6.90692 4.32585 7.27924 C 3.92068 7.65156 3.92068 8.25521 4.32585 8.62753 L 6.90766 11 L 4.32586 13.3725 C 3.92069 13.7448 3.92069 14.3484 4.32586 14.7208 C 4.73103 15.0931 5.38795 15.0931 5.79312 14.7208 L 8.37492 12.3483 L 10.9567 14.7208 C 11.3619 15.0931 12.0188 15.0931 12.424 14.7208 C 12.8291 14.3484 12.8291 13.7448 12.424 13.3725 L 9.84217 11 L 12.424 8.62754 C 12.8291 8.25521 12.8291 7.65156 12.424 7.27924 C 12.0188 6.90692 11.3619 6.90692 10.9567 7.27924 L 8.37492 9.65171 L 5.79311 7.27924 Z"
      fill={color}
      fillRule="evenodd"
      clipRule="evenodd"
    />
  </Svg>
);
