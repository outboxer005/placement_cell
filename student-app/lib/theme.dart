import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Professional Placement App Theme - Orange & White Color Scheme
class AppTheme {
  AppTheme._();

  // ========== BRAND COLORS (Orange/White Theme - Modern & Energetic) ==========
  
  /// Primary Orange - Vibrant orange for main brand color, CTAs (matching web admin)
  static const Color primaryOrange = Color(0xFFFF6B00);  // Vibrant orange (#FF6B00)
  
  /// Light Orange - Subtle backgrounds, hover states
  static const Color lightOrange = Color(0xFFFF9800);  // Material orange
  
  /// Dark Orange - Headers, important text accents
  static const Color darkOrange = Color(0xFFF57C00);  // Dark orange
  
  /// Deep Orange - For gradients and overlays
  static const Color deepOrange = Color(0xFFE65100);  // Deep orange
  
  /// BLACK TEXT - All body text should be black for maximum readability
  static const Color textDark = Color(0xFF000000);  // Pure black for primary text
  
  /// DARK GRAY TEXT - Secondary text
  static const Color textMedium = Color(0xFF424242);  // Dark gray for secondary text
  
  /// MEDIUM GRAY - Tertiary text
  static const Color textLight = Color(0xFF757575);  // Medium gray for hints/captions
  
  /// Light Gray - Borders, dividers
  static const Color borderGray = Color(0xFFE5E7EB);
  
  /// Pure White - Primary background, cards
  static const Color pureWhite = Color(0xFFFFFFFF);
  
  /// Off White - Alternative background for subtle contrast
  static const Color offWhite = Color(0xFFF9FAFB);
  
  /// Accent Yellow-Orange - For highlights
  static const Color accentOrange = Color(0xFFFFAB40);
  
  /// Success Green
  static const Color successGreen = Color(0xFF4CAF50);
  
  /// Warning Amber
  static const Color warningAmber = Color(0xFFFFC107);
  
  /// Error Red
  static const Color errorRed = Color(0xFFF44336);

  // ========== BACKWARD COMPATIBILITY ALIASES ==========
  // Keep old names as aliases so existing widgets don't break
  static const Color primaryBlue = primaryOrange;
  static const Color lightBlue = lightOrange;
  static const Color darkBlue = darkOrange;
  static const Color navyBlue = deepOrange;
  static const Color secondaryOrange = lightOrange;
  static const Color darkNavy = textDark;
  static const Color darkGray = textMedium;
  static const Color lightBeige = offWhite;


  // ========== GRADIENT DEFINITIONS (Orange Theme) ==========
  
  /// Primary orange gradient - Main brand gradient
  static const LinearGradient orangeGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFFFF6B00),  // Primary Orange
      Color(0xFFFF9800),  // Light Orange
      Color(0xFFFFAB40),  // Accent Orange
    ],
  );
  
  /// Simple orange gradient for buttons
  static const LinearGradient simpleOrangeGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primaryOrange, lightOrange],
  );
  
  /// Dark orange gradient for headers
  static const LinearGradient darkOrangeGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [darkOrange, deepOrange],
  );
  
  /// Card gradient for white cards
  static const LinearGradient cardGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [pureWhite, offWhite],
  );
  
  // Backward compatibility aliases
  static const LinearGradient fullUpdateGradient = orangeGradient;
  static const LinearGradient blueGradient = orangeGradient;


  // ========== SPACING CONSTANTS ==========
  
  static const double spacingXs = 4.0;
  static const double spacingS = 8.0;
  static const double spacingM = 16.0;
  static const double spacingL = 24.0;
  static const double spacingXl = 32.0;
  static const double spacingXxl = 48.0;

  // ========== RADIUS CONSTANTS ==========
  
  static const double radiusS = 8.0;
  static const double radiusM = 12.0;
  static const double radiusL = 16.0;
  static const double radiusXl = 24.0;
  static const double radiusFull = 999.0;

  // ========== ELEVATION/SHADOW (Orange Theme) ==========
  
  static List<BoxShadow> shadowLight = [
    BoxShadow(
      color: primaryOrange.withOpacity(0.08),
      blurRadius: 16,
      offset: const Offset(0, 4),
    ),
  ];

  static List<BoxShadow> shadowMedium = [
    BoxShadow(
      color: primaryOrange.withOpacity(0.12),
      blurRadius: 24,
      offset: const Offset(0, 8),
    ),
  ];

  static List<BoxShadow> shadowHeavy = [
    BoxShadow(
      color: primaryOrange.withOpacity(0.16),
      blurRadius: 32,
      offset: const Offset(0, 12),
    ),
  ];
  
  static List<BoxShadow> shadowCard = [
    BoxShadow(
      color: Colors.black.withOpacity(0.04),
      blurRadius: 12,
      offset: const Offset(0, 2),
    ),
  ];

  // ========== ANIMATION DURATIONS ==========
  
  static const Duration animationFast = Duration(milliseconds: 200);
  static const Duration animationNormal = Duration(milliseconds: 300);
  static const Duration animationSlow = Duration(milliseconds: 500);

  // ========== GLASSMORPHISM ==========
  
  static BoxDecoration glassDecoration(BuildContext context, {double blur = 10}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return BoxDecoration(
      color: isDark
          ? deepOrange.withOpacity(0.7)
          : pureWhite.withOpacity(0.9),
      borderRadius: BorderRadius.circular(radiusL),
      border: Border.all(
        color: isDark
            ? lightOrange.withOpacity(0.2)
            : primaryOrange.withOpacity(0.1),
        width: 1,
      ),
      boxShadow: shadowLight,
    );
  }
  
  // ========== ORANGE CARD DECORATION ==========
  
  static BoxDecoration orangeCardDecoration({bool elevated = false}) {
    return BoxDecoration(
      gradient: simpleOrangeGradient,
      borderRadius: BorderRadius.circular(radiusL),
      boxShadow: elevated ? shadowMedium : shadowLight,
    );
  }

  // ========== THEME DATA ==========
  
  /// Light Theme (White background, Orange accents)
  static ThemeData lightTheme(Color seedColor) {
    final colorScheme = ColorScheme.light(
      primary: primaryOrange,
      primaryContainer: lightOrange.withOpacity(0.2),
      secondary: darkOrange,
      secondaryContainer: lightOrange.withOpacity(0.1),
      tertiary: accentOrange,
      surface: pureWhite,
      surfaceContainerHighest: offWhite,
      error: errorRed,
      onPrimary: pureWhite,
      onSecondary: pureWhite,
      onSurface: textDark,
      onSurfaceVariant: textMedium,
      outline: borderGray,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: offWhite, // Light background
      
      // Typography - Professional hierarchy
      textTheme: GoogleFonts.interTextTheme().copyWith(
        displayLarge: GoogleFonts.inter(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: textDark,
          height: 1.2,
        ),
        displayMedium: GoogleFonts.inter(
          fontSize: 28,
          fontWeight: FontWeight.bold,
          color: textDark,
          height: 1.2,
        ),
        displaySmall: GoogleFonts.inter(
          fontSize: 24,
          fontWeight: FontWeight.w600,
          color: textDark,
          height: 1.2,
        ),
        headlineMedium: GoogleFonts.inter(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: textDark,
        ),
        titleLarge: GoogleFonts.inter(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: textDark,
        ),
        titleMedium: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: textDark,
        ),
        bodyLarge: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: FontWeight.normal,
          color: textDark,
        ),
        bodyMedium: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.normal,
          color: textMedium,
        ),
        bodySmall: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.normal,
          color: textMedium,
        ),
        labelLarge: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: textDark,
        ),
      ),
      
      // AppBar Theme - Clean and minimal
      appBarTheme: AppBarTheme(
        centerTitle: false,
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: pureWhite,
        surfaceTintColor: Colors.transparent,
        foregroundColor: textDark,
        titleTextStyle: GoogleFonts.inter(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: textDark,
        ),
        iconTheme: const IconThemeData(color: textDark),
      ),

      // Card Theme - White cards with subtle shadow
      cardTheme: CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusL),
        ),
        color: pureWhite,
        shadowColor: Colors.black.withOpacity(0.04),
      ),

      // Input Decoration - Orange focus states
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: pureWhite,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusM),
          borderSide: BorderSide(color: borderGray),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusM),
          borderSide: BorderSide(color: borderGray),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusM),
          borderSide: const BorderSide(color: primaryOrange, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusM),
          borderSide: const BorderSide(color: errorRed),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: spacingM,
          vertical: spacingM,
        ),
        labelStyle: GoogleFonts.inter(color: textMedium),
        hintStyle: GoogleFonts.inter(color: textMedium.withOpacity(0.6)),
      ),

      // Button Themes - Orange primary buttons
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          backgroundColor: primaryOrange,
          foregroundColor: pureWhite,
          disabledBackgroundColor: textMedium.withOpacity(0.3),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusM),
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: spacingL,
            vertical: spacingM,
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryOrange,
          side: const BorderSide(color: primaryOrange, width: 1.5),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusM),
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: spacingL,
            vertical: spacingM,
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primaryOrange,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusM),
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: spacingM,
            vertical: spacingS,
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // Floating Action Button - Orange
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: primaryOrange,
        foregroundColor: pureWhite,
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusL),
        ),
      ),

      // Navigation Bar - White background with orange selected items
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: pureWhite,
        indicatorColor: primaryOrange.withOpacity(0.15),
        elevation: 8,
        height: 64,
        shadowColor: Colors.black.withOpacity(0.1),
        surfaceTintColor: Colors.transparent,
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final isSelected = states.contains(WidgetState.selected);
          return GoogleFonts.inter(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
            color: isSelected ? primaryOrange : textMedium,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          final isSelected = states.contains(WidgetState.selected);
          return IconThemeData(
            color: isSelected ? primaryOrange : textMedium,
            size: 24,
          );
        }),
      ),

      // Chip Theme - Orange accents
      chipTheme: ChipThemeData(
        backgroundColor: lightBeige,
        selectedColor: lightOrange,
        labelStyle: GoogleFonts.inter(fontSize: 12, color: darkNavy),
        padding: const EdgeInsets.symmetric(horizontal: spacingS, vertical: spacingXs),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusS),
        ),
      ),

      // Divider
      dividerTheme: DividerThemeData(
        color: darkGray.withOpacity(0.1),
        thickness: 1,
        space: 1,
      ),
      
      // Progress Indicator - Orange
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: primaryOrange,
        linearTrackColor: lightBeige,
        circularTrackColor: lightBeige,
      ),
    );
  }

  /// Dark Theme - USING LIGHT ORANGE/WHITE (No Black Backgrounds!)
  static ThemeData darkTheme(Color seedColor) {
    // Using same light scheme but with slight orange tint for "dark" mode
    final colorScheme = ColorScheme.light(
      primary: primaryOrange,
      primaryContainer: lightOrange.withOpacity(0.3),
      secondary: darkOrange,
      secondaryContainer: accentOrange.withOpacity(0.2),
      tertiary: accentOrange,
      surface: offWhite,  // Light background, NO BLACK
      surfaceContainerHighest: lightOrange.withOpacity(0.1),
      error: errorRed,
      onPrimary: pureWhite,  // White text on orange buttons
      onSecondary: pureWhite,
      onSurface: textDark,  // BLACK TEXT on light backgrounds
      onSurfaceVariant: textMedium,  // Dark gray text
      outline: borderGray,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,  // Using light not dark!
      colorScheme: colorScheme,
      scaffoldBackgroundColor: offWhite,  // White background, NO BLACK
      
      // Typography - BLACK text
      textTheme: GoogleFonts.interTextTheme(ThemeData.light().textTheme).copyWith(
        displayLarge: GoogleFonts.inter(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: textDark,  // BLACK
        ),
        titleLarge: GoogleFonts.inter(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: textDark,  // BLACK
        ),
        bodyLarge: GoogleFonts.inter(
          fontSize: 16,
          color: textDark,  // BLACK
        ),
        bodyMedium: GoogleFonts.inter(
          fontSize: 14,
          color: textMedium,  // DARK GRAY
        ),
      ),
      
      // AppBar - White background
      appBarTheme: AppBarTheme(
        centerTitle: false,
        elevation: 0,
        backgroundColor: pureWhite,  // White background
        foregroundColor: textDark,  // BLACK text
        titleTextStyle: GoogleFonts.inter(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: textDark,  // BLACK
        ),
        iconTheme: const IconThemeData(color: textDark),  // BLACK icons
      ),

      // Cards - White background
      cardTheme: CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusL),
        ),
        color: pureWhite,  // White cards, NO BLACK
      ),

      // Buttons - Orange with white text
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryOrange,  // Orange button
          foregroundColor: pureWhite,  // White text on buttons
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusM),
          ),
        ),
      ),

      // Navigation - White background with orange selection
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: pureWhite,  // White nav bar
        indicatorColor: primaryOrange.withOpacity(0.15),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          final isSelected = states.contains(WidgetState.selected);
          return IconThemeData(
            color: isSelected ? primaryOrange : textMedium,  // Orange selected, gray unselected
            size: 24,
          );
        }),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final isSelected = states.contains(WidgetState.selected);
          return GoogleFonts.inter(
            color: isSelected ? primaryOrange : textMedium,  // Orange selected, gray unselected
          );
        }),
      ),
    );
  }
}
