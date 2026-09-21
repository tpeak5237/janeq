"use client";

import { useEffect, useSyncExternalStore } from "react";

import type {
  PayloadResult,
  QrFields,
  QrType,
  ReliabilityMessage,
} from "@/lib/qr";

export type Locale = "en" | "th";

const LOCALE_EVENT = "janeq-locale-change";

const en = {
    siteSubtitle: "Just Another Non-Existent QR Code",
    siteDescription:
      "Create and scan QR codes on this device. No account, no tracking redirect.",
    navGithub: "GitHub",
    languageToThai: "Switch to Thai",
    languageToEnglish: "Switch to English",
    languageThai: "ไทย",
    languageEnglish: "EN",
    themeToDark: "Switch to dark mode",
    themeToLight: "Switch to light mode",
    ariaHome: "JaneQ home",
    ariaMainNav: "Main navigation",
    footerBy: "by theerapat.org",
    footerUtility: "Local QR utility",
    footerSource: "Source",
    footerDomain: "theerapat.org",
    createQr: "Create QR",
    scanQr: "Scan QR",
    ariaToolModes: "QR utility modes",
    scannerAria: "QR scanner",
    scannerInputAria: "QR scanner input",
    scannerDescription: "Camera or image.",
    scannerFullFrameHint: "The whole frame is scanned, not just the square.",
    camera: "Camera",
    uploadImage: "Upload image",
    startCamera: "Start camera",
    stopCamera: "Stop camera",
    switchCamera: "Switch camera",
    turnTorchOn: "Turn on flashlight",
    turnTorchOff: "Turn off flashlight",
    lowLightHint: "Low light. Try a light for a faster scan.",
    cameraPreview: "Camera preview for QR scanning",
    cameraIdle: "Camera is off",
    cameraReady: "Start the camera to scan",
    requestingCamera: "Requesting camera permission…",
    cameraPermissionDenied: "Camera permission was denied. Allow access and try again.",
    noCamera: "No camera was found on this device.",
    cameraRequiresHttps: "Camera scanning requires HTTPS or localhost.",
    cameraUnsupported: "This browser does not support camera access.",
    scanning: "Scanning…",
    chooseImage: "Choose an image",
    dropImageHere: "or drop a QR image here",
    uploadedImagePreview: "Selected QR image preview",
    processingImage: "Reading the image…",
    qrDetected: "QR detected",
    noQrFound: "No QR code found in this image.",
    scannerError: "The scanner could not start. Try another camera or image.",
    scanResult: "Scan result",
    scannerResultHint: "Decoded content appears here.",
    scannerPrivacy: "Stays on this device.",
    scannerUnsafeScheme: "This is not a web link. JaneQ will not open it.",
    copyResult: "Copy",
    copyResultDone: "Copied.",
    clipboardUnavailable: "Clipboard access was unavailable.",
    openLink: "Open link",
    scanAnother: "Scan another",
    typeWebsite: "Website",
    typeWebsiteLong: "Website URL",
    typeText: "Text",
    typeTextLong: "Plain text",
    typeEmail: "Email",
    typePhone: "Phone",
    typeSms: "SMS",
    typeWifi: "Wi-Fi",
    typeContact: "Contact",
    typeLocation: "Location",
    typePromptpay: "PromptPay",
    workspaceAria: "QR code settings",
    qrTypeAria: "QR code type",
    previewAria: "QR preview and export",
    workspaceKicker: "Type",
    workspaceQuestion: "What should it open?",
    livePreview: "Preview",
    previewHeading: "Preview",
    localStatus: "Local",
    updating: "Updating",
    websiteAddress: "Website address",
    websitePlaceholder: "https://example.com",
    websiteHint: "https:// is added if you leave it off.",
    textToEncode: "Text",
    textPlaceholder: "A note or short message",
    emailAddress: "Email address",
    emailPlaceholder: "hello@example.com",
    subjectOptional: "Subject (optional)",
    subjectPlaceholder: "Subject",
    messageOptional: "Message (optional)",
    messagePlaceholder: "Pre-filled message",
    phoneNumber: "Phone number",
    phonePlaceholder: "+66 81 234 5678",
    phoneHint: "Include a country code for international use.",
    smsMessage: "Message",
    smsPlaceholder: "Pre-filled SMS",
    ssid: "Network name (SSID)",
    ssidPlaceholder: "Studio Wi-Fi",
    password: "Password",
    passwordPlaceholder: "Network password",
    security: "Security",
    securityWpa: "WPA / WPA2 / WPA3",
    securityWep: "WEP",
    securityNone: "No password",
    hiddenNetwork: "Hidden network",
    wifiPrivacy: "Stays on this device.",
    name: "Name",
    namePlaceholder: "Jane Appleseed",
    organizationOptional: "Organization (optional)",
    organizationPlaceholder: "Theerapat.org",
    contactPhoneOptional: "Phone number (optional)",
    contactEmailOptional: "Email address (optional)",
    latitude: "Latitude",
    latitudePlaceholder: "13.7563",
    latitudeHint: "Between -90 and 90",
    longitude: "Longitude",
    longitudePlaceholder: "100.5018",
    longitudeHint: "Between -180 and 180",
    labelOptional: "Label (optional)",
    labelPlaceholder: "Bangkok",
    promptpayId: "PromptPay ID",
    promptpayIdPlaceholder: "0812345678",
    promptpayIdHint: "Phone number or PromptPay ID",
    promptpayAmount: "Amount",
    promptpayAmountPlaceholder: "250.00",
    promptpayAmountHint: "Leave blank for payer to enter",
    promptpayPaymentDisclaimer: "JaneQ cannot confirm whether payment succeeded.",
    promptpayRecipientCheck: "Check the recipient name in the banking app before paying.",
    promptpayAmountPayer: "Amount entered by payer",
    promptpayAmountSummary: "฿{{amount}}",
    foreground: "Foreground",
    background: "Background",
    transparent: "Transparent background",
    transparentValue: "transparent",
    transparentDescription: "Place it on a plain, light surface.",
    errorCorrection: "Error correction",
    correctionLow: "Low · smallest",
    correctionMedium: "Medium · default",
    correctionQuartile: "Quartile · more recovery",
    correctionHigh: "High · logo friendly",
    outputSize: "Output size",
    quietZone: "Quiet-zone margin",
    modules: "modules",
    moduleShape: "Module shape",
    squareModules: "Square",
    roundedModules: "Rounded",
    noLogo: "No logo",
    presetLogo: "theerapat.org mark",
    uploadLogo: "Add logo",
    processing: "Processing…",
    logoUsing: "{{name}} · 18% of the code, padded for recovery.",
    emptyPreview: "Enter content to generate a QR",
    drawingCode: "Generating",
    readyDownload: "Ready",
    needsInput: "Check input",
    waitingInput: "Waiting",
    png: "PNG",
    svg: "SVG",
    copyImage: "Copy image",
    copyContent: "Copy content",
    print: "Print",
    staticLabel: "Can't be edited later.",
    staticBody: "Create a new code to change the destination.",
    payloadLabel: "Encoded content",
    reliableHeading: "Scan settings",
    reliableCaption: "Defaults are reliable",
    logoHeading: "Logo",
    logoCaption: "Optional",
    errorUrl: "Enter a valid website address, such as https://example.com.",
    hintUrlNormalized: "This encodes as {{url}}.",
    errorText: "Enter some text to encode.",
    errorEmail: "Enter a valid email address.",
    errorPhone: "Enter a phone number with 5–15 digits.",
    errorSms: "Enter a phone number with 5–15 digits.",
    errorSmsMessage: "Add a message for this SMS code.",
    errorWifiSsid: "Enter the network name (SSID).",
    errorWifiPassword: "Enter the Wi-Fi password or choose No password.",
    errorContactEmpty: "Add a name, phone number, or email address.",
    errorContactPhone: "Check the contact phone number.",
    errorContactEmail: "Check the contact email address.",
    errorLatitude: "Enter a latitude between -90 and 90.",
    errorLongitude: "Enter a longitude between -180 and 180.",
    errorPromptpayIdRequired: "Enter a PromptPay ID.",
    errorPromptpayId: "Check the PromptPay ID and try again.",
    errorPromptpayAmount: "Enter a positive amount with up to 2 decimal places.",
    hintPromptpayAmount: "The amount is pre-filled in compatible banking apps.",
    copyQrPayload: "Copy payload",
    warningContrastTitle: "Contrast is low",
    warningContrastBody:
      "These colors measure {{ratio}}:1. Use a darker foreground on a lighter background.",
    infoTransparentTitle: "Transparent background",
    infoTransparentBody: "Place the code on a light, plain surface so the quiet zone stays visible.",
    warningQuietTitle: "Quiet zone is tight",
    warningQuietBody: "Use a margin of 4 modules or more.",
    warningResolutionTitle: "Output is small",
    warningResolutionBody: "Use at least 256 px for screen or print.",
    infoRoundedTitle: "Rounded modules",
    infoRoundedBody: "Test the downloaded code at the size you will use.",
    warningLogoTitle: "Use high correction with a logo",
    warningLogoBody: "High error correction leaves more room for a center mark.",
    warningPolarityTitle: "Light modules on a dark background",
    warningPolarityBody:
      "Most scanners expect a dark code on a light background. Invert the colors if scans fail.",
    noticeDownloadPng: "PNG downloaded.",
    noticeDownloadSvg: "SVG downloaded.",
    noticeCopyContent: "Copied.",
    noticeCopyImage: "Image copied.",
    noticeClipboardBlocked: "Clipboard was blocked. Select the encoded text to copy it.",
    noticeImageUnsupported: "This browser cannot copy images. Download the PNG instead.",
    noticeImageBlocked: "Clipboard image access was blocked. Download the PNG instead.",
    noticePrintBlocked: "Printing was blocked. Allow pop-ups for JaneQ and try again.",
    noticePrintOpened: "Print view opened.",
    noticeLogoProcessing: "Logo added.",
    noticePngFallback: "The vector preview is ready, but this browser could not prepare a PNG.",
    noticeTooLarge: "This content is too large for a QR code. Shorten the text or lower correction.",
    errorLogoType: "Choose a PNG, JPEG, or WebP image.",
    errorLogoSize: "Logo files must be 2 MB or smaller.",
    errorLogoDecode: "The image could not be decoded.",
    errorLogoDimensions: "The image has no readable dimensions.",
    errorLogoProcess: "The image could not be processed.",
    errorCanvas: "Canvas rendering is not available in this browser.",
    printCaption: "JaneQ",
    altQr: "QR code for {{label}}",
    errorBoundaryEyebrow: "Interrupted",
    errorBoundaryHeading: "Refresh and try again.",
    errorBoundaryBody: "Nothing was sent anywhere.",
    tryAgain: "Try again",
    notFoundEyebrow: "404",
    notFoundHeading: "No such page.",
    notFoundBody: "The generator is still on the home page.",
    backToJaneq: "Back to JaneQ",
} as const;

const th: Record<keyof typeof en, string> = {
    siteSubtitle: "Just Another Non-Existent QR Code",
    siteDescription:
      "สร้างและสแกน QR บนเครื่องนี้ ไม่ต้องสมัคร ไม่มีลิงก์คั่นกลาง",
    navGithub: "GitHub",
    languageToThai: "เปลี่ยนเป็นภาษาไทย",
    languageToEnglish: "เปลี่ยนเป็นภาษาอังกฤษ",
    languageThai: "ไทย",
    languageEnglish: "EN",
    themeToDark: "เปลี่ยนเป็นโหมดมืด",
    themeToLight: "เปลี่ยนเป็นโหมดสว่าง",
    ariaHome: "หน้าแรก JaneQ",
    ariaMainNav: "เมนูหลัก",
    footerBy: "โดย theerapat.org",
    footerUtility: "เครื่องมือ QR บนเครื่องนี้",
    footerSource: "ซอร์สโค้ด",
    footerDomain: "theerapat.org",
    createQr: "สร้าง QR",
    scanQr: "สแกน QR",
    ariaToolModes: "โหมดเครื่องมือ QR",
    scannerAria: "เครื่องมือสแกน QR",
    scannerInputAria: "แหล่งข้อมูลสำหรับสแกน QR",
    scannerDescription: "ใช้กล้องหรือเลือกรูป",
    scannerFullFrameHint: "สแกนทั้งภาพ ไม่จำกัดแค่กรอบ",
    camera: "กล้อง",
    uploadImage: "เลือกรูป",
    startCamera: "เปิดกล้อง",
    stopCamera: "ปิดกล้อง",
    switchCamera: "สลับกล้อง",
    turnTorchOn: "เปิดไฟฉาย",
    turnTorchOff: "ปิดไฟฉาย",
    lowLightHint: "แสงน้อย ลองเปิดไฟแล้วสแกนใหม่",
    cameraPreview: "ภาพจากกล้องสำหรับสแกน QR",
    cameraIdle: "กล้องยังไม่เปิด",
    cameraReady: "กดเปิดกล้องเพื่อสแกน",
    requestingCamera: "กำลังขอสิทธิ์ใช้กล้อง…",
    cameraPermissionDenied: "ยังไม่ได้อนุญาตกล้อง อนุญาตแล้วเปิดใหม่",
    noCamera: "ไม่พบกล้องในเครื่องนี้",
    cameraRequiresHttps: "สแกนด้วยกล้องต้องใช้ HTTPS หรือ localhost",
    cameraUnsupported: "เบราว์เซอร์นี้ใช้กล้องไม่ได้",
    scanning: "กำลังสแกน…",
    chooseImage: "เลือกรูป",
    dropImageHere: "หรือลากรูป QR มาวาง",
    uploadedImagePreview: "ตัวอย่างรูป QR ที่เลือก",
    processingImage: "กำลังอ่านรูป…",
    qrDetected: "พบ QR แล้ว",
    noQrFound: "ไม่พบ QR ในรูปนี้",
    scannerError: "เปิดเครื่องสแกนไม่ได้ ลองกล้องหรือรูปอื่น",
    scanResult: "ผลการสแกน",
    scannerResultHint: "ข้อมูลที่อ่านได้จะแสดงที่นี่",
    scannerPrivacy: "ข้อมูลไม่ออกจากเครื่อง",
    scannerUnsafeScheme: "นี่ไม่ใช่ลิงก์เว็บ JaneQ จะไม่เปิดให้",
    copyResult: "คัดลอก",
    copyResultDone: "คัดลอกแล้ว",
    clipboardUnavailable: "ใช้คลิปบอร์ดไม่ได้",
    openLink: "เปิดลิงก์",
    scanAnother: "สแกนอีกครั้ง",
    typeWebsite: "เว็บไซต์",
    typeWebsiteLong: "ลิงก์เว็บไซต์",
    typeText: "ข้อความ",
    typeTextLong: "ข้อความ",
    typeEmail: "อีเมล",
    typePhone: "โทรศัพท์",
    typeSms: "SMS",
    typeWifi: "Wi-Fi",
    typeContact: "รายชื่อ",
    typeLocation: "ตำแหน่ง",
    typePromptpay: "พร้อมเพย์",
    workspaceAria: "ตั้งค่า QR โค้ด",
    qrTypeAria: "ประเภท QR",
    previewAria: "ตัวอย่างและการดาวน์โหลด QR",
    workspaceKicker: "ประเภท",
    workspaceQuestion: "ต้องการให้เปิดอะไร",
    livePreview: "ตัวอย่าง",
    previewHeading: "ตัวอย่าง",
    localStatus: "บนเครื่องนี้",
    updating: "กำลังอัปเดต",
    websiteAddress: "ลิงก์เว็บไซต์",
    websitePlaceholder: "https://example.com",
    websiteHint: "ถ้าไม่ใส่ https:// จะเติมให้",
    textToEncode: "ข้อความ",
    textPlaceholder: "โน้ตหรือข้อความสั้น ๆ",
    emailAddress: "อีเมล",
    emailPlaceholder: "hello@example.com",
    subjectOptional: "หัวข้อ (ไม่บังคับ)",
    subjectPlaceholder: "หัวข้อ",
    messageOptional: "ข้อความ (ไม่บังคับ)",
    messagePlaceholder: "ข้อความที่ใส่ไว้ล่วงหน้า",
    phoneNumber: "หมายเลขโทรศัพท์",
    phonePlaceholder: "+66 81 234 5678",
    phoneHint: "ใส่รหัสประเทศถ้าใช้ข้ามประเทศ",
    smsMessage: "ข้อความ",
    smsPlaceholder: "ข้อความ SMS ที่ใส่ไว้ล่วงหน้า",
    ssid: "ชื่อเครือข่าย (SSID)",
    ssidPlaceholder: "Studio Wi-Fi",
    password: "รหัสผ่าน",
    passwordPlaceholder: "รหัสผ่านเครือข่าย",
    security: "ความปลอดภัย",
    securityWpa: "WPA / WPA2 / WPA3",
    securityWep: "WEP",
    securityNone: "ไม่มีรหัสผ่าน",
    hiddenNetwork: "เครือข่ายซ่อนอยู่",
    wifiPrivacy: "ข้อมูลไม่ออกจากเครื่อง",
    name: "ชื่อ",
    namePlaceholder: "Jane Appleseed",
    organizationOptional: "องค์กร (ไม่บังคับ)",
    organizationPlaceholder: "Theerapat.org",
    contactPhoneOptional: "หมายเลขโทรศัพท์ (ไม่บังคับ)",
    contactEmailOptional: "อีเมล (ไม่บังคับ)",
    latitude: "ละติจูด",
    latitudePlaceholder: "13.7563",
    latitudeHint: "ระหว่าง -90 ถึง 90",
    longitude: "ลองจิจูด",
    longitudePlaceholder: "100.5018",
    longitudeHint: "ระหว่าง -180 ถึง 180",
    labelOptional: "ป้าย (ไม่บังคับ)",
    labelPlaceholder: "กรุงเทพฯ",
    promptpayId: "เบอร์หรือเลขพร้อมเพย์",
    promptpayIdPlaceholder: "0812345678",
    promptpayIdHint: "เบอร์โทรหรือเลขพร้อมเพย์",
    promptpayAmount: "จำนวนเงิน",
    promptpayAmountPlaceholder: "250.00",
    promptpayAmountHint: "เว้นว่างให้ผู้โอนกรอกเอง",
    promptpayPaymentDisclaimer: "JaneQ ยืนยันการโอนไม่ได้",
    promptpayRecipientCheck: "ตรวจชื่อผู้รับในแอปธนาคารก่อนโอน",
    promptpayAmountPayer: "ผู้โอนกรอกจำนวนเอง",
    promptpayAmountSummary: "฿{{amount}}",
    foreground: "สีคิวอาร์",
    background: "สีพื้น",
    transparent: "พื้นโปร่งใส",
    transparentValue: "โปร่งใส",
    transparentDescription: "วางบนพื้นสว่างเรียบ",
    errorCorrection: "ระดับการกู้คืน",
    correctionLow: "ต่ำ · เล็กสุด",
    correctionMedium: "กลาง · ค่าเริ่มต้น",
    correctionQuartile: "สูงขึ้น · กู้คืนได้มากขึ้น",
    correctionHigh: "สูง · เหมาะกับโลโก้",
    outputSize: "ขนาดไฟล์",
    quietZone: "ระยะขอบ",
    modules: "โมดูล",
    moduleShape: "รูปร่างโมดูล",
    squareModules: "เหลี่ยม",
    roundedModules: "มน",
    noLogo: "ไม่มีโลโก้",
    presetLogo: "โลโก้ theerapat.org",
    uploadLogo: "ใส่โลโก้",
    processing: "กำลังประมวลผล…",
    logoUsing: "{{name}} · ขนาด 18% และเว้นพื้นที่รอบโลโก้",
    emptyPreview: "กรอกข้อมูลเพื่อสร้าง QR",
    drawingCode: "กำลังสร้าง",
    readyDownload: "พร้อมดาวน์โหลด",
    needsInput: "ตรวจข้อมูล",
    waitingInput: "รอข้อมูล",
    png: "PNG",
    svg: "SVG",
    copyImage: "คัดลอกรูป",
    copyContent: "คัดลอกข้อมูล",
    print: "พิมพ์",
    staticLabel: "แก้ปลายทางทีหลังไม่ได้",
    staticBody: "ถ้าต้องการเปลี่ยน ให้สร้างอันใหม่",
    payloadLabel: "ข้อมูลใน QR",
    reliableHeading: "ตั้งค่าการสแกน",
    reliableCaption: "ค่าเริ่มต้นสแกนได้ดี",
    logoHeading: "โลโก้",
    logoCaption: "ไม่บังคับ",
    errorUrl: "ใส่ลิงก์ที่ถูกต้อง เช่น https://example.com",
    hintUrlNormalized: "จะเข้ารหัสเป็น {{url}}",
    errorText: "ใส่ข้อความ",
    errorEmail: "ใส่อีเมลที่ถูกต้อง",
    errorPhone: "ใส่เบอร์ที่มีตัวเลข 5–15 หลัก",
    errorSms: "ใส่เบอร์ที่มีตัวเลข 5–15 หลัก",
    errorSmsMessage: "ใส่ข้อความ SMS",
    errorWifiSsid: "ใส่ชื่อเครือข่าย (SSID)",
    errorWifiPassword: "ใส่รหัสผ่าน หรือเลือก ไม่มีรหัสผ่าน",
    errorContactEmpty: "ใส่ชื่อ เบอร์ หรืออีเมลอย่างน้อยหนึ่งอย่าง",
    errorContactPhone: "ตรวจเบอร์โทร",
    errorContactEmail: "ตรวจอีเมล",
    errorLatitude: "ใส่ละติจูดระหว่าง -90 ถึง 90",
    errorLongitude: "ใส่ลองจิจูดระหว่าง -180 ถึง 180",
    errorPromptpayIdRequired: "ใส่เบอร์หรือเลขพร้อมเพย์",
    errorPromptpayId: "ตรวจเลขพร้อมเพย์แล้วลองใหม่",
    errorPromptpayAmount: "ใส่จำนวนที่มากกว่าศูนย์ ทศนิยมไม่เกิน 2 ตำแหน่ง",
    hintPromptpayAmount: "จำนวนเงินจะขึ้นล่วงหน้าในแอปธนาคารที่รองรับ",
    copyQrPayload: "คัดลอกข้อมูล QR",
    warningContrastTitle: "คอนทราสต์ต่ำ",
    warningContrastBody: "สีชุดนี้ {{ratio}}:1 ใช้สีเข้มบนพื้นสว่าง",
    infoTransparentTitle: "พื้นโปร่งใส",
    infoTransparentBody: "วางบนพื้นสว่างเรียบ เพื่อให้เห็นขอบ",
    warningQuietTitle: "ระยะขอบแคบ",
    warningQuietBody: "ควรมีอย่างน้อย 4 โมดูล",
    warningResolutionTitle: "ไฟล์เล็กไป",
    warningResolutionBody: "ใช้ขนาดอย่างน้อย 256 px",
    infoRoundedTitle: "โมดูลมุมมน",
    infoRoundedBody: "ทดสอบที่ขนาดที่จะใช้จริง",
    warningLogoTitle: "ใส่โลโก้ควรใช้การกู้คืนระดับสูง",
    warningLogoBody: "ระดับสูงช่วยให้สแกนได้แม้มีโลโก้ตรงกลาง",
    warningPolarityTitle: "คิวอาร์สีอ่อนบนพื้นเข้ม",
    warningPolarityBody: "เครื่องสแกนส่วนมากต้องการคิวอาร์เข้มบนพื้นสว่าง ถ้าสแกนไม่ติดให้สลับสี",
    noticeDownloadPng: "ดาวน์โหลด PNG แล้ว",
    noticeDownloadSvg: "ดาวน์โหลด SVG แล้ว",
    noticeCopyContent: "คัดลอกแล้ว",
    noticeCopyImage: "คัดลอกรูปแล้ว",
    noticeClipboardBlocked: "ใช้คลิปบอร์ดไม่ได้ เลือกข้อความแล้วคัดลอกเอง",
    noticeImageUnsupported: "คัดลอกรูปไม่ได้ ให้ดาวน์โหลด PNG",
    noticeImageBlocked: "คัดลอกรูปไม่ได้ ให้ดาวน์โหลด PNG",
    noticePrintBlocked: "เบราว์เซอร์บล็อกการพิมพ์ อนุญาตป๊อปอัปแล้วลองใหม่",
    noticePrintOpened: "เปิดหน้าพิมพ์แล้ว",
    noticeLogoProcessing: "ใส่โลโก้แล้ว",
    noticePngFallback: "ตัวอย่างเวกเตอร์พร้อมแล้ว แต่เตรียม PNG ไม่ได้",
    noticeTooLarge: "ข้อมูลยาวเกิน ลองย่อข้อความหรือลดระดับการกู้คืน",
    errorLogoType: "เลือกไฟล์ PNG, JPEG หรือ WebP",
    errorLogoSize: "ไฟล์โลโก้ไม่เกิน 2 MB",
    errorLogoDecode: "อ่านไฟล์ภาพนี้ไม่ได้",
    errorLogoDimensions: "ไฟล์ภาพไม่มีขนาดที่อ่านได้",
    errorLogoProcess: "ประมวลผลภาพไม่ได้",
    errorCanvas: "เบราว์เซอร์นี้ไม่รองรับ Canvas",
    printCaption: "JaneQ",
    altQr: "QR โค้ดสำหรับ {{label}}",
    errorBoundaryEyebrow: "สะดุดชั่วคราว",
    errorBoundaryHeading: "ลองโหลดใหม่",
    errorBoundaryBody: "ไม่มีข้อมูลถูกส่งออกไป",
    tryAgain: "ลองอีกครั้ง",
    notFoundEyebrow: "404",
    notFoundHeading: "ไม่มีหน้านี้",
    notFoundBody: "ตัวสร้างยังอยู่ที่หน้าแรก",
    backToJaneq: "กลับไป JaneQ",
};

const strings = { en, th };

export type TranslationKey = keyof typeof strings.en;

export function listCopyKeys(locale: Locale): TranslationKey[] {
  return Object.keys(strings[locale]) as TranslationKey[];
}

export function translate(
  locale: Locale,
  key: TranslationKey,
  values: Record<string, string | number> = {},
): string {
  let value: string = strings[locale][key] ?? strings.en[key] ?? key;
  Object.entries(values).forEach(([name, replacement]) => {
    value = value.replaceAll(`{{${name}}}`, String(replacement));
  });
  return value;
}

function getLocale(): Locale {
  if (typeof window === "undefined") return "en";
  return window.localStorage.getItem("janeq-locale") === "th" ? "th" : "en";
}

function subscribeLocale(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(LOCALE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(LOCALE_EVENT, callback);
  };
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribeLocale, getLocale, () => "en");
}

export function setLocale(locale: Locale): void {
  window.localStorage.setItem("janeq-locale", locale);
  document.documentElement.lang = locale === "th" ? "th" : "en";
  window.dispatchEvent(new Event(LOCALE_EVENT));
}

export function LanguageProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale === "th" ? "th" : "en";
  }, [locale]);
  return children;
}

export function useCopy() {
  const locale = useLocale();
  return {
    locale,
    t: (key: TranslationKey, values?: Record<string, string | number>) =>
      translate(locale, key, values),
  };
}

function fieldValue(value: string): string {
  return value.trim();
}

export function localizedPayloadLabel(
  locale: Locale,
  type: QrType,
  fields: QrFields,
): string {
  switch (type) {
    case "url":
      return fieldValue(fields.url) || translate(locale, "typeWebsiteLong");
    case "text":
      return fieldValue(fields.text).slice(0, 50) || translate(locale, "typeTextLong");
    case "email":
      return fieldValue(fields.email) || translate(locale, "typeEmail");
    case "phone":
      return fieldValue(fields.phone) || translate(locale, "typePhone");
    case "sms":
      return fieldValue(fields.smsNumber) || translate(locale, "typeSms");
    case "wifi":
      return fieldValue(fields.wifiSsid) || translate(locale, "typeWifi");
    case "contact":
      return fieldValue(fields.contactName) || translate(locale, "typeContact");
    case "location":
      return fieldValue(fields.locationLabel) || translate(locale, "typeLocation");
    case "promptpay":
      return translate(locale, "typePromptpay");
  }
}

export function localizedPayloadMessage(
  locale: Locale,
  type: QrType,
  fields: QrFields,
  result: PayloadResult,
) {
  let error: string | null = null;
  let hint: string | null = null;
  if (result.error) {
    if (type === "url") error = translate(locale, "errorUrl");
    if (type === "text") error = translate(locale, "errorText");
    if (type === "email") error = translate(locale, "errorEmail");
    if (type === "phone") error = translate(locale, "errorPhone");
    if (type === "sms")
      error = translate(
        locale,
        fields.smsMessage.trim() ? "errorSms" : "errorSmsMessage",
      );
    if (type === "wifi")
      error = translate(
        locale,
        fields.wifiSsid.trim() ? "errorWifiPassword" : "errorWifiSsid",
      );
    if (type === "contact") {
      error = result.error.includes("phone")
        ? translate(locale, "errorContactPhone")
        : result.error.includes("email")
          ? translate(locale, "errorContactEmail")
          : translate(locale, "errorContactEmpty");
    }
    if (type === "location")
      error = translate(
        locale,
        result.error.includes("latitude") ? "errorLatitude" : "errorLongitude",
      );
    if (type === "promptpay") {
      error = translate(
        locale,
        !fields.promptpayId.trim()
          ? "errorPromptpayIdRequired"
          : result.error.includes("amount")
            ? "errorPromptpayAmount"
            : "errorPromptpayId",
      );
    }
  }
  if (result.hint && !result.error) {
    if (type === "url" && !/^https?:\/\//i.test(fields.url.trim())) {
      hint = translate(locale, "hintUrlNormalized", {
        url: result.payload ?? "",
      });
    }
    if (type === "promptpay" && fields.promptpayAmount.trim()) {
      hint = translate(locale, "hintPromptpayAmount");
    }
  }
  return { error, hint };
}

export function localizedReliabilityMessage(
  locale: Locale,
  message: ReliabilityMessage,
) {
  const keyMap: Record<
    string,
    { title: TranslationKey; body: TranslationKey }
  > = {
    contrast: { title: "warningContrastTitle", body: "warningContrastBody" },
    transparent: { title: "infoTransparentTitle", body: "infoTransparentBody" },
    "quiet-zone": { title: "warningQuietTitle", body: "warningQuietBody" },
    resolution: {
      title: "warningResolutionTitle",
      body: "warningResolutionBody",
    },
    rounded: { title: "infoRoundedTitle", body: "infoRoundedBody" },
    "logo-correction": { title: "warningLogoTitle", body: "warningLogoBody" },
    polarity: { title: "warningPolarityTitle", body: "warningPolarityBody" },
  };
  const keys = keyMap[message.id];
  if (!keys) return message;
  const ratio = message.body.match(/([0-9.]+):1/)?.[1];
  return {
    ...message,
    title: translate(locale, keys.title),
    body: translate(locale, keys.body, ratio ? { ratio } : {}),
  };
}
