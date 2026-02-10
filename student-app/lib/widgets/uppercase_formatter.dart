  void dispose() {
    courseName.dispose();
    durationFrom.dispose();
    durationTo.dispose();
    courseType.dispose();
    institute.dispose();
    board.dispose();
    specialization.dispose();
    marksObtained.dispose();
    totalMarks.dispose();
    percentage.dispose();
  }

  Map<String, dynamic> toPayload() {
    final from = durationFrom.text.trim();
    final to = durationTo.text.trim();
    return {
      if (courseName.text.trim().isNotEmpty) 'courseName': courseName.text.trim(),
      if (durationFrom.text.trim().isNotEmpty) 'durationFrom': from,
      if (durationTo.text.trim().isNotEmpty) 'durationTo': to,
      if (courseType.text.trim().isNotEmpty) 'courseType': courseType.text.trim(),
      if (institute.text.trim().isNotEmpty) 'institute': institute.text.trim(),
      if (board.text.trim().isNotEmpty) 'board': board.text.trim(),
      if (specialization.text.trim().isNotEmpty) 'specialization': specialization.text.trim(),
      if (marksObtained.text.trim().isNotEmpty) 'marksObtained': marksObtained.text.trim(),
      if (totalMarks.text.trim().isNotEmpty) 'totalMarks': totalMarks.text.trim(),
      if (percentage.text.trim().isNotEmpty) 'percentage': percentage.text.trim(),
    };
  }
}

// UpperCaseTextFormatter: Automatically converts input to uppercase
class UpperCaseTextFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    return TextEditingValue(
      text: newValue.text.toUpperCase(),
      selection: newValue.selection,
    );
  }
}
