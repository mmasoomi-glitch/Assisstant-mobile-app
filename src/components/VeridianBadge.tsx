/**
 * Veridian Badge (React Native) — parallel to the web VeridianBadge.
 */
import React from "react";
import { Image, Text, View, ViewStyle, StyleProp } from "react-native";

type Variant = "icon" | "pill";

interface Props {
  variant?: Variant;
  label?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export const VeridianBadge: React.FC<Props> = ({
  variant = "icon",
  label = "Veridian",
  size = 16,
  style,
}) => {
  const logo = require("../../assets/brand/veridian_logo.png");

  if (variant === "pill") {
    return (
      <View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: "rgba(189, 178, 255, 0.4)",
            backgroundColor: "rgba(189, 178, 255, 0.08)",
          },
          style,
        ]}
      >
        <Image
          source={logo}
          style={{ width: size, height: size, marginRight: 4 }}
          resizeMode="contain"
        />
        <Text style={{ color: "#bdb2ff", fontSize: 12, fontWeight: "500" }}>
          {label}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={logo}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
    />
  );
};

export default VeridianBadge;
