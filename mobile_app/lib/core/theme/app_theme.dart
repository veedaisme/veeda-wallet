import 'package:flutter/material.dart';

// Helper function to convert HSL values from CSS to Flutter Color
// CSS: hue (0-360), saturation (0-100%), lightness (0-100%)
// Flutter HSLColor: hue (0-360), saturation (0-1.0), lightness (0-1.0)
Color _hslToColor(double h, double s, double l, [double opacity = 1.0]) {
  return HSLColor.fromAHSL(opacity, h, s / 100.0, l / 100.0).toColor();
}

class AppColors {
  // Light Theme Colors from :root
  static final Color lightBackground = Colors.white;
  static final Color lightForeground = _hslToColor(0, 0, 20);
  static final Color lightCard = _hslToColor(0, 0, 100);
  static final Color lightCardForeground = _hslToColor(0, 0, 20);
  static final Color lightPopover = _hslToColor(0, 0, 100);
  static final Color lightPopoverForeground = _hslToColor(0, 0, 20);
  static final Color lightPrimary = _hslToColor(13.21, 73.04, 54.90);
  static final Color lightPrimaryForeground = _hslToColor(0, 0, 100);
  static final Color lightSecondary = _hslToColor(220.00, 14.29, 95.88);
  static final Color lightSecondaryForeground = _hslToColor(215, 13.79, 34.12);
  static final Color lightMuted = _hslToColor(210, 20.00, 98.04);
  static final Color lightMutedForeground = _hslToColor(220, 8.94, 46.08);
  static final Color lightAccent = _hslToColor(207.69, 46.43, 89.02);
  static final Color lightAccentForeground = _hslToColor(224.44, 64.29, 32.94);
  static final Color lightDestructive = _hslToColor(0, 84.24, 60.20);
  static final Color lightDestructiveForeground = _hslToColor(0, 0, 100);
  static final Color lightBorder = _hslToColor(210, 9.37, 87.45);
  static final Color lightInput = _hslToColor(220, 15.79, 96.27);
  static final Color lightRing = _hslToColor(13.21, 73.04, 54.90);

  // Dark Theme Colors from .dark
  static final Color darkBackground = _hslToColor(219.13, 29.11, 15.49);
  static final Color darkForeground = _hslToColor(0, 0, 89.80);
  static final Color darkCard = _hslToColor(223.64, 20.75, 20.78);
  static final Color darkCardForeground = _hslToColor(0, 0, 89.80);
  static final Color darkPopover = _hslToColor(223.33, 19.15, 18.43);
  static final Color darkPopoverForeground = _hslToColor(0, 0, 89.80);
  static final Color darkPrimary = _hslToColor(13.21, 73.04, 54.90); // Same as light
  static final Color darkPrimaryForeground = _hslToColor(0, 0, 100); // Same as light
  static final Color darkSecondary = _hslToColor(222, 19.23, 20.39);
  static final Color darkSecondaryForeground = _hslToColor(0, 0, 89.80);
  static final Color darkMuted = _hslToColor(222, 19.23, 20.39);
  static final Color darkMutedForeground = _hslToColor(0, 0, 63.92);
  static final Color darkAccent = _hslToColor(223.64, 34.38, 25.10);
  static final Color darkAccentForeground = _hslToColor(213.33, 96.92, 87.25);
  static final Color darkDestructive = _hslToColor(0, 84.24, 60.20); // Same as light
  static final Color darkDestructiveForeground = _hslToColor(0, 0, 100); // Same as light
  static final Color darkBorder = _hslToColor(224.35, 15.86, 28.43);
  static final Color darkInput = _hslToColor(224.35, 15.86, 28.43);
  static final Color darkRing = _hslToColor(13.21, 73.04, 54.90); // Same as light
}

class AppTheme {
  static const String _fontSans = 'Inter';

  static final double _radius = 12.0; // 0.75rem, assuming 1rem = 16px

  static final ThemeData lightTheme = ThemeData(
    brightness: Brightness.light,
    primaryColor: AppColors.lightPrimary,
    scaffoldBackgroundColor: AppColors.lightBackground,
    fontFamily: _fontSans,
    colorScheme: ColorScheme(
      brightness: Brightness.light,
      primary: AppColors.lightPrimary,
      onPrimary: AppColors.lightPrimaryForeground,
      secondary: AppColors.lightSecondary, // Using CSS 'secondary' for Flutter 'secondary'
      onSecondary: AppColors.lightSecondaryForeground,
      error: AppColors.lightDestructive,
      onError: AppColors.lightDestructiveForeground,
      background: AppColors.lightBackground,
      onBackground: AppColors.lightForeground,
      surface: AppColors.lightCard, // Using CSS 'card' for Flutter 'surface'
      onSurface: AppColors.lightCardForeground,
      outline: AppColors.lightBorder,
      // Tertiary could map to accent or be a new color
      tertiary: AppColors.lightAccent,
      onTertiary: AppColors.lightAccentForeground,
      // Inverse primary for things like SnackBar background on dark themes
      inversePrimary: AppColors.darkPrimary, 
      // Surface tint is often a slightly opaque version of primary on surface
      surfaceTint: AppColors.lightPrimary.withOpacity(0.05),
    ),
    textTheme: _textTheme(_fontSans, AppColors.lightForeground),
    cardTheme: CardTheme(
      elevation: 0, // CSS shadows are separate, Flutter's card elevation can be 0 if using custom shadows
      color: AppColors.lightCard,
      surfaceTintColor: AppColors.lightCard, // To prevent default tinting
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(_radius),
        side: BorderSide(color: AppColors.lightBorder, width: 1),
      ),
      margin: EdgeInsets.all(0), // Default card margin, can be overridden
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.lightInput,
      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(_radius),
        borderSide: BorderSide(color: AppColors.lightBorder, width: 1),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(_radius),
        borderSide: BorderSide(color: AppColors.lightBorder, width: 1),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(_radius),
        borderSide: BorderSide(color: AppColors.lightRing, width: 2),
      ),
      labelStyle: TextStyle(color: AppColors.lightMutedForeground),
      hintStyle: TextStyle(color: AppColors.lightMutedForeground.withOpacity(0.7)),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.lightBackground,
      foregroundColor: AppColors.lightForeground,
      elevation: 0, // Control shadow with a Border or custom shadow
      surfaceTintColor: AppColors.lightBackground, // to prevent Material 3 tinting
    ),
    dialogTheme: DialogTheme(
      backgroundColor: AppColors.lightPopover,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(_radius)),
      titleTextStyle: TextStyle(fontFamily: _fontSans, color: AppColors.lightPopoverForeground, fontSize: 20, fontWeight: FontWeight.bold),
      contentTextStyle: TextStyle(fontFamily: _fontSans, color: AppColors.lightPopoverForeground, fontSize: 16),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.lightPrimary,
        foregroundColor: AppColors.lightPrimaryForeground,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(_radius)),
        padding: EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        textStyle: TextStyle(fontFamily: _fontSans, fontWeight: FontWeight.w500)
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
       style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.lightPrimary,
        side: BorderSide(color: AppColors.lightBorder),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(_radius)),
        padding: EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        textStyle: TextStyle(fontFamily: _fontSans, fontWeight: FontWeight.w500)
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: AppColors.lightPrimary,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(_radius)),
        padding: EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        textStyle: TextStyle(fontFamily: _fontSans, fontWeight: FontWeight.w500)
      )
    ),
    dividerColor: AppColors.lightBorder,
  );

  static final ThemeData darkTheme = ThemeData(
    brightness: Brightness.dark,
    primaryColor: AppColors.darkPrimary,
    scaffoldBackgroundColor: AppColors.darkBackground,
    fontFamily: _fontSans,
    colorScheme: ColorScheme(
      brightness: Brightness.dark,
      primary: AppColors.darkPrimary,
      onPrimary: AppColors.darkPrimaryForeground,
      secondary: AppColors.darkSecondary,
      onSecondary: AppColors.darkSecondaryForeground,
      error: AppColors.darkDestructive,
      onError: AppColors.darkDestructiveForeground,
      background: AppColors.darkBackground,
      onBackground: AppColors.darkForeground,
      surface: AppColors.darkCard,
      onSurface: AppColors.darkCardForeground,
      outline: AppColors.darkBorder,
      tertiary: AppColors.darkAccent,
      onTertiary: AppColors.darkAccentForeground,
      inversePrimary: AppColors.lightPrimary,
      surfaceTint: AppColors.darkPrimary.withOpacity(0.05),
    ),
    textTheme: _textTheme(_fontSans, AppColors.darkForeground),
    cardTheme: CardTheme(
      elevation: 0,
      color: AppColors.darkCard,
      surfaceTintColor: AppColors.darkCard,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(_radius),
        side: BorderSide(color: AppColors.darkBorder, width: 1),
      ),
      margin: EdgeInsets.all(0),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.darkInput,
      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(_radius),
        borderSide: BorderSide(color: AppColors.darkBorder, width: 1),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(_radius),
        borderSide: BorderSide(color: AppColors.darkBorder, width: 1),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(_radius),
        borderSide: BorderSide(color: AppColors.darkRing, width: 2),
      ),
      labelStyle: TextStyle(color: AppColors.darkMutedForeground),
      hintStyle: TextStyle(color: AppColors.darkMutedForeground.withOpacity(0.7)),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.darkBackground,
      foregroundColor: AppColors.darkForeground,
      elevation: 0,
      surfaceTintColor: AppColors.darkBackground, 
    ),
    dialogTheme: DialogTheme(
      backgroundColor: AppColors.darkPopover,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(_radius)),
      titleTextStyle: TextStyle(fontFamily: _fontSans, color: AppColors.darkPopoverForeground, fontSize: 20, fontWeight: FontWeight.bold),
      contentTextStyle: TextStyle(fontFamily: _fontSans, color: AppColors.darkPopoverForeground, fontSize: 16),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.darkPrimary,
        foregroundColor: AppColors.darkPrimaryForeground,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(_radius)),
        padding: EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        textStyle: TextStyle(fontFamily: _fontSans, fontWeight: FontWeight.w500)
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
       style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.darkPrimary,
        side: BorderSide(color: AppColors.darkBorder),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(_radius)),
        padding: EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        textStyle: TextStyle(fontFamily: _fontSans, fontWeight: FontWeight.w500)
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: AppColors.darkPrimary,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(_radius)),
        padding: EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        textStyle: TextStyle(fontFamily: _fontSans, fontWeight: FontWeight.w500)
      )
    ),
    dividerColor: AppColors.darkBorder,
  );

  // Basic TextTheme, can be expanded further
  static TextTheme _textTheme(String fontFamily, Color displayColor) {
    // Using Material 3 type scale as a base for font sizes
    // You might want to adjust these sizes to better match your web theme
    return TextTheme(
      displayLarge: TextStyle(fontFamily: fontFamily, fontSize: 57, fontWeight: FontWeight.w400, color: displayColor, letterSpacing: -0.25),
      displayMedium: TextStyle(fontFamily: fontFamily, fontSize: 45, fontWeight: FontWeight.w400, color: displayColor, letterSpacing: 0),
      displaySmall: TextStyle(fontFamily: fontFamily, fontSize: 36, fontWeight: FontWeight.w400, color: displayColor, letterSpacing: 0),
      
      headlineLarge: TextStyle(fontFamily: fontFamily, fontSize: 32, fontWeight: FontWeight.w400, color: displayColor, letterSpacing: 0),
      headlineMedium: TextStyle(fontFamily: fontFamily, fontSize: 28, fontWeight: FontWeight.w400, color: displayColor, letterSpacing: 0),
      headlineSmall: TextStyle(fontFamily: fontFamily, fontSize: 24, fontWeight: FontWeight.w400, color: displayColor, letterSpacing: 0),
      
      titleLarge: TextStyle(fontFamily: fontFamily, fontSize: 22, fontWeight: FontWeight.w500, color: displayColor, letterSpacing: 0.15),
      titleMedium: TextStyle(fontFamily: fontFamily, fontSize: 16, fontWeight: FontWeight.w500, color: displayColor, letterSpacing: 0.15),
      titleSmall: TextStyle(fontFamily: fontFamily, fontSize: 14, fontWeight: FontWeight.w500, color: displayColor, letterSpacing: 0.1),
      
      bodyLarge: TextStyle(fontFamily: fontFamily, fontSize: 16, fontWeight: FontWeight.w400, color: displayColor, letterSpacing: 0.5),
      bodyMedium: TextStyle(fontFamily: fontFamily, fontSize: 14, fontWeight: FontWeight.w400, color: displayColor, letterSpacing: 0.25),
      bodySmall: TextStyle(fontFamily: fontFamily, fontSize: 12, fontWeight: FontWeight.w400, color: displayColor, letterSpacing: 0.4),
      
      labelLarge: TextStyle(fontFamily: fontFamily, fontSize: 14, fontWeight: FontWeight.w500, color: displayColor, letterSpacing: 0.1),
      labelMedium: TextStyle(fontFamily: fontFamily, fontSize: 12, fontWeight: FontWeight.w500, color: displayColor, letterSpacing: 0.5),
      labelSmall: TextStyle(fontFamily: fontFamily, fontSize: 11, fontWeight: FontWeight.w500, color: displayColor, letterSpacing: 0.5),
    ).apply(fontFamily: fontFamily, displayColor: displayColor, bodyColor: displayColor);
  }
}
