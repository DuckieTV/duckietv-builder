;;; Define your application name
!define APPNAME "DuckieTV"
!define APPNAMEANDVERSION "DuckieTV {{NIGHTLY}}{{VERSION}}"

;;; Main Install settings
Name "${APPNAMEANDVERSION}"
InstallDir "$APPDATA\DuckieTV"
InstallDirRegKey HKLM "Software\DuckieTV" ""
OutFile "{{SETUP_OUTPUT_FILENAME}}"

;;; Modern interface settings
!include "MUI.nsh"
!define MUI_ICON "img\favicon.ico"
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN "$INSTDIR\DuckieTV.exe"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE.md"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

;;; Set languages (first is default language)
!insertmacro MUI_LANGUAGE "English"
!insertmacro MUI_RESERVEFILE_LANGDLL

Section "DuckieTV" Section1

	;;; Set Section properties
	SetOverwrite on

	;;; Set Section Files and Shortcuts
	SetOutPath "$INSTDIR\"
	File /r "*"
	
	CreateShortCut "$DESKTOP\DuckieTV.lnk" "$INSTDIR\DuckieTV.exe" "" $INSTDIR\img\favicon.ico" 0
	CreateDirectory "$SMPROGRAMS\DuckieTV"
	CreateShortCut "$SMPROGRAMS\DuckieTV\DuckieTV.lnk" "$INSTDIR\DuckieTV.exe" "" $INSTDIR\img\favicon.ico" 0
	CreateShortCut "$SMPROGRAMS\DuckieTV\Uninstall.lnk" "$INSTDIR\uninstall.exe" "" $INSTDIR\img\favicon.ico" 0

SectionEnd

Section -FinishSection

	WriteRegStr HKLM "Software\DuckieTV" "" "$INSTDIR"
	WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\DuckieTV" "DisplayName" "DuckieTV"
	WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\DuckieTV" "UninstallString" "$INSTDIR\uninstall.exe"
	WriteUninstaller "$INSTDIR\uninstall.exe"

SectionEnd

;;; Modern install component descriptions
!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
!insertmacro MUI_DESCRIPTION_TEXT "BLAHBLAHBLAH" "bla blabla"
!insertmacro MUI_FUNCTION_DESCRIPTION_END

;;; Uninstall section
Section Uninstall

	;;; Remove from registry...
	DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\DuckieTV"
	DeleteRegKey HKLM "SOFTWARE\DuckieTV"

	;;; Delete self
	Delete "$INSTDIR\uninstall.exe"

	;;; Delete Shortcuts
	Delete "$DESKTOP\DuckieTV.lnk"
	Delete "$SMPROGRAMS\DuckieTV\DuckieTV.lnk"
	Delete "$SMPROGRAMS\DuckieTV\Uninstall.lnk"

	;;; Clean up DuckieTV
	RMDir /r /REBOOTOK $INSTDIR
	RMDir "$SMPROGRAMS\DuckieTV"

SectionEnd

BrandingText "The TV-Show tracker you've been waiting for"

;;; eof