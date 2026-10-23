import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export interface Ring {
  value: number; // 0..n (có thể > 1 khi vượt mục tiêu)
  color: string;
}

/** Vòng tiến độ đồng tâm kiểu Apple Fitness. */
export function Rings({ rings, size = 132, stroke = 14, track }: { rings: Ring[]; size?: number; stroke?: number; track: string }) {
  const gap = 3;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {rings.map((r, i) => {
          const radius = size / 2 - stroke / 2 - i * (stroke + gap);
          const circ = 2 * Math.PI * radius;
          const pct = Math.max(0, Math.min(1, r.value));
          return (
            <React.Fragment key={i}>
              <Circle cx={size / 2} cy={size / 2} r={radius} stroke={r.color + '33'} strokeWidth={stroke} fill="none" />
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={r.value > 1 ? '#FF453A' : r.color}
                strokeWidth={stroke}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${circ * pct} ${circ}`}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            </React.Fragment>
          );
        })}
        <Circle cx={size / 2} cy={size / 2} r={1} fill={track} />
      </Svg>
    </View>
  );
}
