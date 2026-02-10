import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import '../services/api.dart';
import '../theme.dart';
import '../widgets/progress_stepper.dart';
import '../widgets/premium_text_field.dart';
import '../widgets/glass_card.dart';

class RegistrationPage extends StatefulWidget {
  final VoidCallback onRegistered;
  const RegistrationPage({super.key, required this.onRegistered});
  
  @override
  State<RegistrationPage> createState() => _RegistrationPageState();
}

class _RegistrationPageState extends State<RegistrationPage> with TickerProviderStateMixin {
  int _currentStep = 0;
  final _formKeys = List.generate(4, (_) => GlobalKey<FormState>());
  
  // Controllers - Personal Info
  final _regdCtrl = TextEditingController();
  final _firstNameCtrl = TextEditingController();
  final _lastNameCtrl = TextEditingController();
  final _fatherCtrl = TextEditingController();
  final _nationalityCtrl = TextEditingController();
  final _collegeCtrl = TextEditingController();
  final _dobCtrl = TextEditingController(); // Controller to show selected DOB
  String _branch = '';
  String _gender = '';
  String _nationality = 'India'; // Default nationality
  DateTime? _dob;

  // Controllers - Contact & Academic
  final _emailCtrl = TextEditingController();
  final _altEmailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _altPhoneCtrl = TextEditingController();
  final _cgpaCtrl = TextEditingController();
  final _yearCtrl = TextEditingController();
  final _sectionCtrl = TextEditingController();
  final _currentYearCtrl = TextEditingController();
  final _resumeCtrl = TextEditingController();
  final _aadharCtrl = TextEditingController();
  final _panCtrl = TextEditingController();
  bool _hasBreaks = false;
  bool _hasBacklogs = false;

  // Controllers - Addresses
  final AddressControllers _permanentAddress = AddressControllers(label: 'Permanent');
  final AddressControllers _presentAddress = AddressControllers(label: 'Present');

  // Controllers - Education
  final EducationControllers _degreeEducation = EducationControllers();
  final EducationControllers _interEducation = EducationControllers();
  final EducationControllers _sscEducation = EducationControllers();

  bool _loading = false;
  String? _error;

  final _branches = const ['CSE', 'ECE', 'EEE', 'IT', 'MECH', 'CIVIL', 'AERO', 'CHEM', 'BIOTECH'];
  final _genders = const ['Male', 'Female', 'Other'];
  final _years = const ['2024', '2025', '2026', '2027'];

  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeInOut,
    );
    _fadeController.forward();
    // Set default nationality
    _nationalityCtrl.text = 'India';
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _regdCtrl.dispose();
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _fatherCtrl.dispose();
    _emailCtrl.dispose();
    _altEmailCtrl.dispose();
    _phoneCtrl.dispose();
    _altPhoneCtrl.dispose();
    _cgpaCtrl.dispose();
    _yearCtrl.dispose();
    _sectionCtrl.dispose();
    _currentYearCtrl.dispose();
    _resumeCtrl.dispose();
    _aadharCtrl.dispose();
    _panCtrl.dispose();
    _nationalityCtrl.dispose();
    _collegeCtrl.dispose();
    _dobCtrl.dispose();
    _permanentAddress.dispose();
    _presentAddress.dispose();
    _degreeEducation.dispose();
    _interEducation.dispose();
    _sscEducation.dispose();
    super.dispose();
  }

  void _nextStep() {
    if (_formKeys[_currentStep].currentState?.validate() ?? false) {
      if (_currentStep == 0) {
        if (_dob == null) {
          setState(() => _error = 'Please select your date of birth');
          return;
        }
        if (_branch.isEmpty) {
          setState(() => _error = 'Please select your branch');
          return;
        }
        if (_gender.isEmpty) {
          setState(() => _error = 'Please select your gender');
          return;
        }
      }
      
      setState(() {
        _error = null;
        if (_currentStep < 3) {
          _currentStep++;
          _fadeController.reset();
          _fadeController.forward();
        } else {
          _submit();
        }
      });
    }
  }

  void _previousStep() {
    setState(() {
      if (_currentStep > 0) {
        _currentStep--;
        _fadeController.reset();
        _fadeController.forward();
      }
    });
  }

  Future<void> _submit() async {
    final regd = _regdCtrl.text.trim();
    if (regd.isEmpty) {
      setState(() => _error = 'Registration ID is required');
      return;
    }
    
    setState(() {
      _loading = true;
      _error = null;
    });
    
    try {
      final cgpa = _cgpaCtrl.text.trim().isEmpty ? null : double.tryParse(_cgpaCtrl.text.trim());
      final dateStr = DateFormat('yyyy-MM-dd').format(_dob!);
      final passwordForCache = DateFormat('ddMMyyyy').format(_dob!);
      
      await Api.registerStudent(
        regdId: regd,
        firstName: _firstNameCtrl.text.trim(),
        lastName: _lastNameCtrl.text.trim().isEmpty ? null : _lastNameCtrl.text.trim(),
        email: _emailCtrl.text.trim(),
        phone: _phoneCtrl.text.trim(),
        branch: _branch,
        dob: dateStr,
        passwordForCache: passwordForCache,
        fatherName: _fatherCtrl.text.trim(),
        altEmail: _altEmailCtrl.text.trim(),
        altPhone: _altPhoneCtrl.text.trim(),
        cgpa: cgpa,
        year: _yearCtrl.text.trim(),
        section: _sectionCtrl.text.trim(),
        currentYear: _currentYearCtrl.text.trim(),
        gender: _gender,
        nationality: _nationalityCtrl.text.trim(),
        college: _collegeCtrl.text.trim(),
        resumeUrl: _resumeCtrl.text.trim(),
        breakInStudies: _hasBreaks,
        hasBacklogs: _hasBacklogs,
        aadharNumber: _aadharCtrl.text.trim(),
        panCard: _panCtrl.text.trim(),
        permanentAddress: _permanentAddress.toPayload(),
        presentAddress: _presentAddress.toPayload(),
        degree: _degreeEducation.toPayload(),
        inter: _interEducation.toPayload(),
        ssc: _sscEducation.toPayload(),
      );
      widget.onRegistered();
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _pickDob() async {
    final now = DateTime.now();
    final initial = _dob ?? DateTime(now.year - 20, now.month, now.day);
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(now.year - 40),
      lastDate: DateTime(now.year - 15, now.month, now.day),
    );
    if (picked != null) {
      setState(() {
        _dob = picked;
        // Update the controller to show the selected date
        _dobCtrl.text = DateFormat("dd MMM yyyy").format(picked);
      });
    }
  }

  Future<void> _showNonIndianDialog() async {
    final controller = TextEditingController();
    final result = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Enter Nationality'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            labelText: 'Nationality',
            hintText: 'e.g., American, British',
            border: OutlineInputBorder(),
          ),
          autofocus: true,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              if (controller.text.trim().isNotEmpty) {
                Navigator.pop(context, controller.text.trim());
              }
            },
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
    
    if (result != null && result.isNotEmpty) {
      setState(() {
        _nationalityCtrl.text = result;
      });
    } else {
      // User cancelled, revert to India
      setState(() {
        _nationality = 'India';
        _nationalityCtrl.text = 'India';
      });
    }
  }

  void _copyAddress() {
    setState(() {
      _presentAddress.house.text = _permanentAddress.house.text;
      _presentAddress.street.text = _permanentAddress.street.text;
      _presentAddress.area.text = _permanentAddress.area.text;
      _presentAddress.city.text = _permanentAddress.city.text;
      _presentAddress.state.text = _permanentAddress.state.text;
      _presentAddress.postalCode.text = _permanentAddress.postalCode.text;
      _presentAddress.country.text = _permanentAddress.country.text;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Address copied from permanent address'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              theme.colorScheme.primaryContainer.withOpacity(0.3),
              theme.colorScheme.secondaryContainer.withOpacity(0.2),
              theme.colorScheme.tertiaryContainer.withOpacity(0.1),
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.all(AppTheme.spacingL),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        IconButton(
                          onPressed: () => Navigator.of(context).pop(),
                          icon: const Icon(Icons.arrow_back),
                        ),
                        const SizedBox(width: AppTheme.spacingS),
                        Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
                              Text(
                                'Create Account',
                                style: theme.textTheme.headlineSmall?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                'Step ${_currentStep + 1} of 4',
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  color: theme.colorScheme.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppTheme.spacingL),
                    ProgressStepper(
                      currentStep: _currentStep,
                      totalSteps: 4,
                      stepLabels: const [
                        'Personal Info',
                        'Contact & Academic',
                        'Addresses',
                        'Education History',
                      ],
                    ),
                  ],
                ),
              ),
              
              // Error banner
              if (_error != null)
                Container(
                  width: double.infinity,
                  margin: const EdgeInsets.symmetric(horizontal: AppTheme.spacingL),
                  padding: const EdgeInsets.all(AppTheme.spacingM),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.errorContainer,
                    borderRadius: BorderRadius.circular(AppTheme.radiusM),
                    border: Border.all(color: theme.colorScheme.error),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.error_outline, color: theme.colorScheme.error),
                      const SizedBox(width: AppTheme.spacingS),
                      Expanded(
                        child: Text(
                          _error!,
                          style: TextStyle(
                            color: theme.colorScheme.onErrorContainer,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              
              const SizedBox(height: AppTheme.spacingM),
              
              // Step content
              Expanded(
                child: FadeTransition(
                  opacity: _fadeAnimation,
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingL),
                    child: Form(
                      key: _formKeys[_currentStep],
                      child: _buildStepContent(),
                    ),
                  ),
                ),
              ),
              
              // Navigation buttons
              Container(
                padding: const EdgeInsets.all(AppTheme.spacingL),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surface.withOpacity(0.95),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 10,
                      offset: const Offset(0, -5),
                    ),
                  ],
                ),
                child: WizardNavigation(
                  canGoBack: _currentStep > 0,
                  canGoNext: true,
                  onBack: _previousStep,
                  onNext: _nextStep,
                  nextLabel: _currentStep == 3 ? 'Submit' : 'Next',
                  isLoading: _loading,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStepContent() {
    switch (_currentStep) {
      case 0:
        return _buildPersonalInfoStep();
      case 1:
        return _buildContactAcademicStep();
      case 2:
        return _buildAddressesStep();
      case 3:
        return _buildEducationStep();
      default:
        return const SizedBox();
    }
  }

  Widget _buildPersonalInfoStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionCard(
          title: 'Basic Information',
          description: 'Essential details for your account and profile',
          icon: Icons.person_outline,
          child: Column(
            children: [
              PremiumTextField(
                controller: _regdCtrl,
                labelText: 'University Registration ID *',
                hintText: 'e.g., VU2025001',
                prefixIcon: Icons.badge,
                inputFormatters: [UpperCaseTextFormatter()],
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: AppTheme.spacingM),
              PremiumTextField(
                controller: _firstNameCtrl,
                labelText: 'First Name *',
                hintText: 'Enter your first name',
                prefixIcon: Icons.person,
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: AppTheme.spacingM),
              PremiumTextField(
                controller: _lastNameCtrl,
                labelText: 'Last Name (Surname)',
                hintText: 'Enter your last name',
                prefixIcon: Icons.person_outline,
              ),
              const SizedBox(height: AppTheme.spacingM),
              PremiumTextField(
                controller: _fatherCtrl,
                labelText: "Father's Name",
                prefixIcon: Icons.person_2_outlined,
              ),
            ],
          ),
        ),
        const SizedBox(height: AppTheme.spacingL),
        SectionCard(
          title: 'Demographics',
          icon: Icons.info_outline,
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: PremiumDropdown(
                      labelText: 'Gender *',
                      prefixIcon: Icons.person_outline,
                      value: _gender.isEmpty ? null : _gender,
                      items: _genders,
                      onChanged: (v) => setState(() => _gender = v ?? ''),
                    ),
                  ),
                  const SizedBox(width: AppTheme.spacingM),
                  Expanded(
                    child: PremiumDropdown(
                      labelText: 'Branch *',
                      prefixIcon: Icons.school,
                      value: _branch.isEmpty ? null : _branch,
                      items: _branches,
                      onChanged: (v) => setState(() => _branch = v ?? ''),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppTheme.spacingM),
              PremiumTextField(
                controller: _dobCtrl,
                labelText: 'Date of Birth *',
                hintText: 'Select your date of birth',
                prefixIcon: Icons.cake_outlined,
                readOnly: true,
                onTap: _pickDob,
              ),
              const SizedBox(height: AppTheme.spacingM),
              Row(
                children: [
                  Expanded(
                    child: PremiumDropdown(
                      labelText: 'Nationality *',
                      prefixIcon: Icons.flag_outlined,
                      value: _nationality,
                      items: const ['India', 'Non-Indian'],
                      onChanged: (v) {
                        setState(() {
                          _nationality = v ?? 'India';
                          if (_nationality == 'India') {
                            _nationalityCtrl.text = 'India';
                          } else {
                            // Open dialog for Non-Indian
                            Future.delayed(Duration.zero, () => _showNonIndianDialog());
                          }
                        });
                      },
                    ),
                  ),
                  const SizedBox(width: AppTheme.spacingM),
                  Expanded(
                    child: PremiumTextField(
                      controller: _collegeCtrl,
                      labelText: 'College',
                      prefixIcon: Icons.apartment_outlined,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: AppTheme.spacingXl),
      ],
    );
  }

  Widget _buildContactAcademicStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionCard(
          title: 'Contact Information',
          description: 'How we\'ll reach you with important updates',
          icon: Icons.contact_mail_outlined,
          child: Column(
            children: [
              PremiumTextField(
                controller: _emailCtrl,
                labelText: 'Primary Email *',
                hintText: 'your.email@example.com',
                prefixIcon: Icons.email_outlined,
                keyboardType: TextInputType.emailAddress,
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return 'Required';
                  final ok = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(v.trim());
                  return ok ? null : 'Invalid email';
                },
              ),
              const SizedBox(height: AppTheme.spacingM),
              PremiumTextField(
                controller: _altEmailCtrl,
                labelText: 'Alternate Email',
                prefixIcon: Icons.alternate_email,
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: AppTheme.spacingM),
              PremiumTextField(
                controller: _phoneCtrl,
                labelText: 'Mobile Number *',
                hintText: '+91 1234567890',
                prefixIcon: Icons.phone_android,
                keyboardType: TextInputType.phone,
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return 'Required';
                  final digits = v.replaceAll(RegExp(r'\D'), '');
                  return digits.length >= 7 ? null : 'Invalid number';
                },
              ),
              const SizedBox(height: AppTheme.spacingM),
              PremiumTextField(
                controller: _altPhoneCtrl,
                labelText: 'Emergency Contact',
                prefixIcon: Icons.support_agent,
                keyboardType: TextInputType.phone,
              ),
            ],
          ),
        ),
        const SizedBox(height: AppTheme.spacingL),
        SectionCard(
          title: 'Identity Documents',
          description: 'Optional: Provide for faster verification',
          icon: Icons.credit_card_outlined,
          child: Column(
            children: [
              PremiumTextField(
                controller: _aadharCtrl,
                labelText: 'Aadhar Card Number',
                hintText: '1234 5678 9012',
                prefixIcon: Icons.badge_outlined,
                keyboardType: TextInputType.number,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(12),
                ],
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return null;
                  return v.trim().length == 12 ? null : 'Must be 12 digits';
                },
              ),
              const SizedBox(height: AppTheme.spacingM),
              PremiumTextField(
                controller: _panCtrl,
                labelText: 'PAN Card Number',
                hintText: 'ABCDE1234F',
                prefixIcon: Icons.payment_outlined,
                inputFormatters: [
                  UpperCaseTextFormatter(),
                  LengthLimitingTextInputFormatter(10),
                ],
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return null;
                  final pan = v.trim().toUpperCase();
                  final valid = RegExp(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$').hasMatch(pan);
                  return valid ? null : 'Invalid PAN format';
                },
              ),
            ],
          ),
        ),
        const SizedBox(height: AppTheme.spacingL),
        SectionCard(
          title: 'Academic Details',
           icon: Icons.school_outlined,
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: PremiumTextField(
                      controller: _cgpaCtrl,
                      labelText: 'Current CGPA',
                      hintText: 'e.g., 8.5',
                      prefixIcon: Icons.grade_outlined,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return null;
                        final cg = double.tryParse(v.trim());
                        if (cg == null || cg < 0 || cg > 10) {
                          return 'Enter value between 0 and 10';
                        }
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(width: AppTheme.spacingM),
                  Expanded(
                    child: PremiumDropdown(
                      labelText: 'Graduation Year',
                      prefixIcon: Icons.calendar_today,
                      value: _yearCtrl.text.isEmpty ? null : _yearCtrl.text,
                      items: _years,
                      onChanged: (v) => setState(() => _yearCtrl.text = v ?? ''),
                    ),
                  ),
                  const SizedBox(width: AppTheme.spacingM),
                  Expanded(
                    child: PremiumTextField(
                      controller: _sectionCtrl,
                      labelText: 'Section',
                      hintText: 'e.g., A',
                      prefixIcon: Icons.group_outlined,
                      inputFormatters: [
                        UpperCaseTextFormatter(),
                        LengthLimitingTextInputFormatter(5),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppTheme.spacingM),
              Row(
                children: [
                  Expanded(
                    child: PremiumDropdown(
                      labelText: 'Current Academic Year',
                      prefixIcon: Icons.school,
                      value: _currentYearCtrl.text.isEmpty ? null : _currentYearCtrl.text,
                      items: const ['1st Year', '2nd Year', '3rd Year', '4th Year'],
                      onChanged: (v) => setState(() => _currentYearCtrl.text = v ?? ''),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppTheme.spacingM),
              PremiumTextField(
                controller: _resumeCtrl,
                labelText: 'Resume / Portfolio URL',
                hintText: 'https://',
                prefixIcon: Icons.web_asset_outlined,
                keyboardType: TextInputType.url,
              ),
              const SizedBox(height: AppTheme.spacingM),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Any break in studies?'),
                subtitle: const Text('Be honest so we can guide you better'),
                value: _hasBreaks,
                onChanged: (v) => setState(() => _hasBreaks = v),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Pending backlogs right now?'),
                value: _hasBacklogs,
                onChanged: (v) => setState(() => _hasBacklogs = v),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppTheme.spacingXl),
      ],
    );
  }

  Widget _buildAddressesStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionCard(
          title: 'Permanent Address',
          description: 'Your permanent residential address',
          icon: Icons.home_outlined,
          child: _buildAddressFields(_permanentAddress),
        ),
        const SizedBox(height: AppTheme.spacingL),
        Center(
          child: OutlinedButton.icon(
            onPressed: _copyAddress,
            icon: const Icon(Icons.content_copy),
            label: const Text('Copy to Present Address'),
          ),
        ),
        const SizedBox(height: AppTheme.spacingL),
        SectionCard(
          title: 'Present Address',
          description: 'Your current residential address',
          icon: Icons.location_on_outlined,
          child: _buildAddressFields(_presentAddress),
        ),
        const SizedBox(height: AppTheme.spacingXl),
      ],
    );
  }

  Widget _buildAddressFields(AddressControllers ctrl) {
    return Column(
      children: [
        PremiumTextField(
          controller: ctrl.house,
          labelText: 'House / Apartment',
          prefixIcon: Icons.apartment,
        ),
        const SizedBox(height: AppTheme.spacingM),
        PremiumTextField(
          controller: ctrl.street,
          labelText: 'Street / Lane',
          prefixIcon: Icons.signpost_outlined,
        ),
        const SizedBox(height: AppTheme.spacingM),
        PremiumTextField(
          controller: ctrl.area,
          labelText: 'Area / Landmark',
          prefixIcon: Icons.location_city,
        ),
        const SizedBox(height: AppTheme.spacingM),
        Row(
          children: [
            Expanded(
              child: PremiumTextField(
                controller: ctrl.city,
                labelText: 'City',
                prefixIcon: Icons.location_city_outlined,
              ),
            ),
            const SizedBox(width: AppTheme.spacingM),
            Expanded(
              child: PremiumTextField(
                controller: ctrl.state,
                labelText: 'State',
                prefixIcon: Icons.map_outlined,
              ),
            ),
          ],
        ),
        const SizedBox(height: AppTheme.spacingM),
        Row(
          children: [
            Expanded(
              child: PremiumTextField(
                controller: ctrl.postalCode,
                labelText: 'PIN Code',
                prefixIcon: Icons.pin_outlined,
                keyboardType: TextInputType.number,
              ),
            ),
            const SizedBox(width: AppTheme.spacingM),
            Expanded(
              child: PremiumTextField(
                controller: ctrl.country,
                labelText: 'Country',
                prefixIcon: Icons.flag_outlined,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildEducationStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionCard(
          title: 'Degree / Undergraduate',
          description: 'Your current degree program details',
          icon: Icons.school,
          child: _buildEducationFields(_degreeEducation),
        ),
        const SizedBox(height: AppTheme.spacingL),
        SectionCard(
          title: 'Intermediate (11th & 12th)',
          description: 'Your intermediate education details',
          icon: Icons.menu_book,
          child: _buildEducationFields(_interEducation),
        ),
        const SizedBox(height: AppTheme.spacingL),
        SectionCard(
          title: 'SSC / 10th Class',
          description: 'Your secondary education details',
          icon: Icons.library_books,
          child: _buildEducationFields(_sscEducation),
        ),
        const SizedBox(height: AppTheme.spacingXl),
      ],
    );
  }

  Widget _buildEducationFields(EducationControllers ctrl) {
    return Column(
      children: [
        PremiumTextField(
          controller: ctrl.courseName,
          labelText: 'Course / Program',
          hintText: 'e.g., B.Tech Computer Science',
          prefixIcon: Icons.school_outlined,
        ),
        const SizedBox(height: AppTheme.spacingM),
        PremiumTextField(
          controller: ctrl.specialization,
          labelText: 'Specialization',
          prefixIcon: Icons.star_outline,
        ),
        const SizedBox(height: AppTheme.spacingM),
        PremiumTextField(
          controller: ctrl.institute,
          labelText: 'Institute / College',
          prefixIcon: Icons.business_outlined,
        ),
        const SizedBox(height: AppTheme.spacingM),
        PremiumTextField(
          controller: ctrl.board,
          labelText: 'Board / University',
          prefixIcon: Icons.account_balance_outlined,
        ),
        const SizedBox(height: AppTheme.spacingM),
        Row(
          children: [
            Expanded(
              child: PremiumTextField(
                controller: ctrl.durationFrom,
                labelText: 'From (DD-MM-YYYY)',
                prefixIcon: Icons.calendar_today,
                keyboardType: TextInputType.datetime,
              ),
            ),
            const SizedBox(width: AppTheme.spacingM),
            Expanded(
              child: PremiumTextField(
                controller: ctrl.durationTo,
                labelText: 'To (DD-MM-YYYY)',
                prefixIcon: Icons.event,
                keyboardType: TextInputType.datetime,
              ),
            ),
          ],
        ),
        const SizedBox(height: AppTheme.spacingM),
        Row(
          children: [
            Expanded(
              child: PremiumTextField(
                controller: ctrl.marksObtained,
                labelText: 'Marks Obtained',
                prefixIcon: Icons.grade,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
              ),
            ),
            const SizedBox(width: AppTheme.spacingM),
            Expanded(
              child: PremiumTextField(
                controller: ctrl.totalMarks,
                labelText: 'Total Marks',
                prefixIcon: Icons.assignment,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
              ),
            ),
          ],
        ),
        const SizedBox(height: AppTheme.spacingM),
        PremiumTextField(
          controller: ctrl.percentage,
          labelText: 'Percentage %',
          prefixIcon: Icons.percent,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
        ),
      ],
    );
  }
}

// Address Controllers class
class AddressControllers {
  AddressControllers({required this.label});

  final String label;
  final TextEditingController house = TextEditingController();
  final TextEditingController street = TextEditingController();
  final TextEditingController area = TextEditingController();
  final TextEditingController city = TextEditingController();
  final TextEditingController state = TextEditingController();
  final TextEditingController postalCode = TextEditingController();
  final TextEditingController country = TextEditingController();

  Map<String, dynamic>? toPayload() {
    final map = {
      'house': house.text.trim(),
      'street': street.text.trim(),
      'area': area.text.trim(),
      'city': city.text.trim(),
      'state': state.text.trim(),
      'postalCode': postalCode.text.trim(),
      'country': country.text.trim(),
    };
    map.removeWhere((key, value) => value == null || value.isEmpty);
    return map.isEmpty ? null : map;
  }

  void dispose() {
    house.dispose();
    street.dispose();
    area.dispose();
    city.dispose();
    state.dispose();
    postalCode.dispose();
    country.dispose();
  }
}

// Education Controllers class
class EducationControllers {
  EducationControllers();
  final TextEditingController courseName = TextEditingController();
  final TextEditingController durationFrom = TextEditingController();
  final TextEditingController durationTo = TextEditingController();
  final TextEditingController courseType = TextEditingController();
  final TextEditingController institute = TextEditingController();
  final TextEditingController board = TextEditingController();
  final TextEditingController specialization = TextEditingController();
  final TextEditingController marksObtained = TextEditingController();
  final TextEditingController totalMarks = TextEditingController();
  final TextEditingController percentage = TextEditingController();

  Map<String, dynamic>? toPayload() {
    final map = {
      'courseName': courseName.text.trim(),
      'durationFrom': durationFrom.text.trim(),
      'durationTo': durationTo.text.trim(),
      'courseType': courseType.text.trim(),
      'institute': institute.text.trim(),
      'board': board.text.trim(),
      'specialization': specialization.text.trim(),
      'marksObtained': marksObtained.text.trim(),
      'totalMarks': totalMarks.text.trim(),
      'percentage': percentage.text.trim(),
    };
    map.removeWhere((key, value) => value == null || value.isEmpty);
    return map.isEmpty ? null : map;
  }

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
}

/// UpperCaseTextFormatter: Automatically converts input to uppercase
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
