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

const strings: Record<Locale, Record<string, string>> = {
  en: {
    siteSubtitle: "Just Another Non-Existent QR Code",
    navWhy: "Why JaneQ",
    navDomain: "theerapat.org",
    navGithub: "GitHub",
    languageToThai: "Switch to Thai",
    languageToEnglish: "Switch to English",
    languageThai: "ไทย",
    languageEnglish: "EN",
    themeToDark: "Switch to dark mode",
    themeToLight: "Switch to light mode",
    ariaHome: "JaneQ home",
    ariaMainNav: "Main navigation",
    ariaPromises: "JaneQ product promises",
    heroEyebrow: "A public utility by theerapat.org",
    heroH1A: "QR codes",
    heroH1Accent: "without",
    heroH1B: "the nonsense.",
    heroLede:
      "Create permanent, direct QR codes without advertisements, tracking redirects, accounts, or subscriptions.",
    heroCta: "Create a QR code",
    browserGenerated: "Generated in your browser",
    trustNoRedirect: "No redirect links",
    trustNoExpiry: "No expiration",
    trustFree: "Free to download",
    heroVisualTop: "DIRECT / STATIC / YOURS",
    heroVisualBottom: "NO MIDDLEMAN",
    section01: "01",
    sectionMake: "Make it yours",
    sectionH2A: "Put the destination",
    sectionH2B: "inside the code.",
    sectionLede:
      "Choose a format, make your code legible, then download a file that can stand on its own.",
    whyEyebrow: "Why this exists",
    whyHeading: "Why does a QR code need an advertisement?",
    whyEmphasis:
      "A QR code is already a tiny piece of technology. It does not need a toll booth.",
    whyBody:
      "Some services place a redirect page between the scan and the destination, show ads, track scans, expire codes, or hold the download behind a subscription. JaneQ takes the quieter route: encode the destination directly and get out of the way.",
    whyList1: "Direct payload, no JaneQ URL in the middle.",
    whyList2: "Local generation, so your content stays in your browser.",
    whyList3: "Downloaded static files do not depend on this site.",
    ownershipEyebrow: "Keep the receipt",
    ownershipHeading: "Your QR code should belong to you.",
    ownershipBody:
      "Once JaneQ generates your static QR code, the downloaded file works independently. JaneQ does not need to remain online for the code to continue functioning.",
    ownershipNoteLabel: "One honest limitation",
    ownershipNoteStrong: "Static codes cannot be edited after download.",
    ownershipNoteBody: "To change the destination, make a new code.",
    privacyHeading: "Small promise, clear boundary.",
    privacyP1:
      "QR codes are generated in the browser. JaneQ does not store QR content, upload logos, create redirect links, or sell QR-generation data.",
    privacyP2:
      "That promise is about the code generator. Always review the destination you encode; JaneQ cannot verify whether a destination is safe.",
    privacyOpen: "Open source by design.",
    privacyRead: "Read the code",
    acceptableEyebrow: "Use it well",
    acceptableHeading: "Make useful codes for people, not traps for them.",
    acceptableBody:
      "JaneQ is for ordinary, lawful communication. Do not use it to impersonate someone, hide harmful destinations, or distribute content you do not have the right to share. A QR code is only a container; responsibility still belongs to the person who publishes it.",
    footerBy: "by theerapat.org",
    footerTagline: "Just Another Non-Existent QR Code.",
    footerSource: "Source",
    footerDomain: "theerapat.org",
    typeWebsite: "Website",
    typeWebsiteLong: "Website URL",
    typeWebsiteDescription: "Open a direct web address",
    typeText: "Text",
    typeTextLong: "Plain text",
    typeTextDescription: "Share a note or short message",
    typeEmail: "Email",
    typeEmailDescription: "Compose an email",
    typePhone: "Phone",
    typePhoneDescription: "Start a phone call",
    typeSms: "SMS",
    typeSmsDescription: "Open a text message",
    typeWifi: "Wi-Fi",
    typeWifiDescription: "Share network access",
    typeContact: "Contact",
    typeContactDescription: "Save contact information",
    typeLocation: "Location",
    typeLocationDescription: "Open a map location",
    workspaceAria: "QR code settings",
    qrTypeAria: "QR code type",
    previewAria: "QR preview and export",
    workspaceKicker: "Direct input",
    workspaceQuestion: "What should it open?",
    livePreview: "Live preview",
    directCode: "Your direct code",
    browserOnly: "Browser only",
    updating: "Updating",
    detailsSuffix: "details",
    requiredCaption: "Required fields marked by validation",
    reliableHeading: "Make it scan well",
    reliableCaption: "Reliable defaults included",
    logoHeading: "Optional center mark",
    logoCaption: "Embedded locally",
    websiteAddress: "Website address",
    websitePlaceholder: "https://example.com",
    websiteHint:
      "https:// is added only to the encoded payload when you leave it off.",
    textToEncode: "Text to encode",
    textPlaceholder: "A note, instruction, or short message",
    emailAddress: "Email address",
    emailPlaceholder: "hello@example.com",
    subjectOptional: "Subject (optional)",
    subjectPlaceholder: "A quick hello",
    messageOptional: "Message (optional)",
    messagePlaceholder: "Write a pre-filled message",
    phoneNumber: "Phone number",
    phonePlaceholder: "+66 81 234 5678",
    phoneHint: "Include a country code when sharing across regions.",
    smsMessage: "Message",
    smsPlaceholder: "A pre-filled SMS message",
    ssid: "Network name (SSID)",
    ssidPlaceholder: "Studio Wi-Fi",
    password: "Password",
    passwordPlaceholder: "Your network password",
    security: "Security",
    securityWpa: "WPA / WPA2 / WPA3",
    securityWep: "WEP",
    securityNone: "No password",
    hiddenNetwork: "This is a hidden network",
    wifiPrivacy:
      "Wi-Fi credentials are processed locally in this browser. JaneQ does not transmit or save them.",
    name: "Name",
    namePlaceholder: "Jane Appleseed",
    organizationOptional: "Organization (optional)",
    organizationPlaceholder: "Theerapat.org",
    latitude: "Latitude",
    latitudePlaceholder: "13.7563",
    latitudeHint: "Between -90 and 90",
    longitude: "Longitude",
    longitudePlaceholder: "100.5018",
    longitudeHint: "Between -180 and 180",
    labelOptional: "Label (optional)",
    labelPlaceholder: "Bangkok",
    foreground: "Foreground",
    background: "Background",
    transparent: "Transparent background",
    transparentValue: "transparent",
    transparentDescription: "Useful for placing the code on a plain surface.",
    errorCorrection: "Error correction",
    correctionLow: "Low · smallest",
    correctionMedium: "Medium · default",
    correctionQuartile: "Quartile · more recovery",
    correctionHigh: "High · logo friendly",
    outputSize: "Output size",
    quietZone: "Quiet-zone margin",
    modules: "modules",
    moduleShape: "Module shape",
    squareModules: "Square modules",
    roundedModules: "Rounded modules",
    noLogo: "No logo",
    presetLogo: "theerapat.org mark",
    uploadLogo: "Upload logo",
    processing: "Processing…",
    logoUsing:
      "Using {{name}}. The mark is scaled to 18% of the code and padded for recovery.",
    logoProcessed:
      "Logo processed locally and embedded into this browser session only.",
    emptyPreview: "Your preview starts here",
    drawingCode: "Drawing your code",
    emptyPrompt: "Enter content on the left and JaneQ will draw it locally.",
    readyDownload: "Ready to download",
    needsInput: "Needs input",
    waitingInput: "Waiting for input",
    directPayload: "Direct payload",
    noAccount: "No account",
    noExpiry: "No expiry",
    statusValid:
      "This code contains a direct payload. Nothing passes through JaneQ when it is scanned.",
    statusWaiting:
      "The export buttons will appear ready once the payload is valid.",
    png: "PNG",
    svg: "SVG",
    copyImage: "Copy image",
    copyContent: "Copy content",
    print: "Print",
    staticLabel: "Static means honest.",
    staticBody:
      "Once you download this code, the destination cannot be edited. To change it, create a new QR code.",
    payloadLabel: "Encoded content",
    noContent: "No content yet",
    errorUrl: "Enter a valid website address, such as https://example.com.",
    hintUrlNormalized:
      "This will encode as {{url}}. The field itself stays unchanged.",
    hintUrlDirect:
      "The full URL, including its path and query, is encoded directly.",
    errorText: "Enter some text to encode.",
    hintText: "Text is encoded exactly as entered.",
    errorEmail: "Enter a valid email address.",
    hintEmail: "A mailto link opens the user’s mail app.",
    errorPhone: "Enter a phone number with 5–15 digits.",
    hintPhone: "The number is encoded directly; JaneQ never calls it.",
    errorSms: "Enter a phone number with 5–15 digits.",
    errorSmsMessage: "Add a message for this SMS code.",
    hintSms: "The code opens a pre-filled SMS composer.",
    errorWifiSsid: "Enter the network name (SSID).",
    errorWifiPassword: "Enter the Wi-Fi password or choose No password.",
    hintWifi:
      "Wi-Fi credentials stay locally in this browser and are never uploaded.",
    errorContactEmpty: "Add a name, phone number, or email address.",
    errorContactPhone: "Check the contact phone number.",
    errorContactEmail: "Check the contact email address.",
    hintContact: "The contact card is encoded directly in the QR image.",
    errorLatitude: "Enter a latitude between -90 and 90.",
    errorLongitude: "Enter a longitude between -180 and 180.",
    hintLocation: "The location opens in a map app that supports geo links.",
    warningContrastTitle: "Contrast is getting soft",
    warningContrastBody:
      "The current colors measure {{ratio}}:1. QR scanners prefer a much darker foreground against its background.",
    infoTransparentTitle: "Transparent background",
    infoTransparentBody:
      "Place the downloaded code on a light, plain surface so the quiet zone stays visible.",
    warningQuietTitle: "Quiet zone is tight",
    warningQuietBody:
      "A margin of 4 modules or more gives scanners the breathing room they expect.",
    warningResolutionTitle: "Output is small",
    warningResolutionBody:
      "Use at least 256 px for a reliable screen or print result.",
    infoRoundedTitle: "Rounded modules enabled",
    infoRoundedBody:
      "Rounded modules are kept inside each cell; test the downloaded code at its intended size.",
    warningLogoTitle: "Use high correction with a logo",
    warningLogoBody:
      "High error correction gives the center mark more recovery room. JaneQ will still generate this code.",
    noticeDownloadPng: "PNG downloaded. It works independently of JaneQ.",
    noticeDownloadSvg: "Vector SVG downloaded. It stays sharp at any size.",
    noticeCopyContent: "Direct payload copied to the clipboard.",
    noticeCopyImage: "QR image copied to the clipboard.",
    noticeClipboardBlocked:
      "Clipboard access was blocked. Select the payload text to copy it manually.",
    noticeImageUnsupported:
      "This browser does not support copying images. Download the PNG instead.",
    noticeImageBlocked:
      "Clipboard image access was blocked. Download the PNG instead.",
    noticePrintBlocked:
      "Printing was blocked by the browser. Allow pop-ups for JaneQ and try again.",
    noticePrintOpened: "Print view opened in a new tab.",
    noticeLogoProcessing:
      "Logo processed locally and embedded into this browser session only.",
    noticePngFallback:
      "The vector preview is ready, but this browser could not prepare a PNG copy.",
    noticeTooLarge:
      "This content is too large for a QR code. Try shorter text or a lower correction level.",
    errorLogoType: "Choose a PNG, JPEG, or WebP image.",
    errorLogoSize: "Logo files must be 2 MB or smaller.",
    errorLogoDecode: "The image could not be decoded.",
    errorLogoDimensions: "The image has no readable dimensions.",
    errorLogoProcess: "The image could not be processed locally.",
    errorCanvas: "Canvas rendering is not available in this browser.",
    printCaption: "Generated with JaneQ — direct, static, yours.",
    altQr: "QR code for {{label}}",
    errorBoundaryEyebrow: "Something interrupted the local utility",
    errorBoundaryHeading: "The generator needs a refresh.",
    errorBoundaryBody:
      "No QR content was sent anywhere. Try the page again and your browser will rebuild the workspace.",
    tryAgain: "Try again",
    notFoundEyebrow: "404 / no destination",
    notFoundHeading: "This page went missing.",
    notFoundBody: "The JaneQ generator is still right where you left it.",
    backToJaneq: "Back to JaneQ",
  },
  th: {
    siteSubtitle: "เครื่องมือสร้าง QR โค้ดตรง",
    navWhy: "ทำไมต้อง JaneQ",
    navDomain: "theerapat.org",
    navGithub: "GitHub",
    languageToThai: "เปลี่ยนเป็นภาษาไทย",
    languageToEnglish: "เปลี่ยนเป็นภาษาอังกฤษ",
    languageThai: "ไทย",
    languageEnglish: "EN",
    themeToDark: "เปลี่ยนเป็นโหมดมืด",
    themeToLight: "เปลี่ยนเป็นโหมดสว่าง",
    ariaHome: "หน้าแรก JaneQ",
    ariaMainNav: "เมนูหลัก",
    ariaPromises: "จุดเด่นของ JaneQ",
    heroEyebrow: "เครื่องมือสาธารณะจาก THEERAPAT.ORG",
    heroH1A: "สร้าง QR โค้ด",
    heroH1Accent: "แบบตรงไปตรงมา",
    heroH1B: "",
    heroLede:
      "ไม่มีโฆษณา ไม่มีลิงก์คั่นกลาง และไม่ต้องสมัครสมาชิก\nสร้างเสร็จแล้วดาวน์โหลดไปใช้ได้เลย",
    heroCta: "สร้าง QR โค้ด",
    browserGenerated: "สร้างบนอุปกรณ์ของคุณ",
    trustNoRedirect: "ไม่ผ่านลิงก์ JaneQ",
    trustNoExpiry: "ไม่ต้องสมัครสมาชิก",
    trustFree: "ดาวน์โหลดฟรี",
    heroVisualTop: "ตรง / ถาวร / ใช้ต่อได้",
    heroVisualBottom: "ไม่มีคนกลาง",
    section01: "01",
    sectionMake: "สร้าง QR โค้ด",
    sectionH2A: "เลือกปลายทาง แล้วสร้าง QR โค้ด",
    sectionH2B: "",
    sectionLede: "เลือกรูปแบบ กรอกข้อมูล แล้วดูตัวอย่างก่อนดาวน์โหลด",
    whyEyebrow: "ทำไมต้อง JaneQ",
    whyHeading: "ทำไม QR โค้ดต้องมีโฆษณาคั่นกลาง?",
    whyEmphasis: "สแกนแล้วควรถึงปลายทางทันที",
    whyBody:
      "เครื่องมือบางแห่งพาผู้สแกนผ่านลิงก์ของผู้ให้บริการก่อนถึงปลายทาง\nจึงอาจมีโฆษณา การติดตาม วันหมดอายุ หรือข้อจำกัดในการดาวน์โหลด\n\nJaneQ เขียนข้อมูลปลายทางลงใน QR โค้ดโดยตรง\nจึงไม่ต้องผ่านหน้าอื่นของเรา",
    whyList1: "ตรงถึงปลายทาง\nไม่มีลิงก์ของ JaneQ คั่นกลาง",
    whyList2:
      "สร้างบนอุปกรณ์ของคุณ\nข้อมูลที่กรอกใช้สร้าง QR โค้ดภายในเบราว์เซอร์",
    whyList3: "ดาวน์โหลดแล้วใช้ต่อได้\nไฟล์ QR ไม่ต้องพึ่ง JaneQ หลังดาวน์โหลด",
    ownershipEyebrow: "ดาวน์โหลดแล้วเป็นของคุณ",
    ownershipHeading: "สร้างเสร็จแล้ว\nนำไปใช้ได้เลย",
    ownershipBody:
      "หลังดาวน์โหลด ไฟล์ QR จะทำงานได้โดยไม่ต้องเชื่อมต่อกับ JaneQ คุณสามารถเก็บไว้ พิมพ์ หรือเผยแพร่ได้ตามต้องการ",
    ownershipNoteLabel: "ข้อจำกัด",
    ownershipNoteStrong: "QR โค้ดแบบตรงไม่สามารถเปลี่ยนปลายทางภายหลังได้",
    ownershipNoteBody: "หากต้องการใช้ปลายทางใหม่ ให้สร้าง QR โค้ดใหม่",
    privacyHeading: "JaneQ ทำอะไร — และไม่ทำ",
    privacyP1:
      "QR โค้ดสร้างในเบราว์เซอร์นี้ JaneQ ไม่เก็บข้อมูลที่กรอก ไม่อัปโหลดโลโก้ ไม่สร้างลิงก์คั่นกลาง และไม่ขายข้อมูลการสร้าง QR",
    privacyP2:
      "ข้อมูลนี้อธิบายเฉพาะตัวสร้าง QR โค้ด โปรดตรวจสอบปลายทางก่อนนำไปใช้ เพราะ JaneQ ไม่สามารถรับรองความปลอดภัยของปลายทางได้",
    privacyOpen: "เปิดซอร์ส",
    privacyRead: "ดูโค้ด",
    acceptableEyebrow: "ใช้อย่างรับผิดชอบ",
    acceptableHeading: "อย่าหลอกผู้สแกน",
    acceptableBody:
      "อย่าใช้ QR โค้ดเพื่อแอบอ้าง ซ่อนปลายทางอันตราย\nหรือเผยแพร่สิ่งที่คุณไม่มีสิทธิ์ใช้\n\nผู้สร้างและผู้เผยแพร่ QR โค้ดเป็นผู้รับผิดชอบ\nต่อปลายทางและวิธีนำไปใช้งาน",
    footerBy: "โดย theerapat.org",
    footerTagline: "QR โค้ดที่ไม่ใส่อะไรเกินจำเป็น",
    footerSource: "ซอร์สโค้ด",
    footerDomain: "theerapat.org",
    typeWebsite: "เว็บไซต์",
    typeWebsiteLong: "รายละเอียดเว็บไซต์",
    typeWebsiteDescription: "เปิดลิงก์",
    typeText: "ข้อความ",
    typeTextLong: "รายละเอียดข้อความ",
    typeTextDescription: "แสดงข้อความ",
    typeEmail: "อีเมล",
    typeEmailDescription: "เปิดหน้าส่งอีเมล",
    typePhone: "โทรศัพท์",
    typePhoneDescription: "โทรออก",
    typeSms: "SMS",
    typeSmsDescription: "เปิดข้อความพร้อมส่ง",
    typeWifi: "Wi-Fi",
    typeWifiDescription: "เชื่อมต่อเครือข่าย",
    typeContact: "ข้อมูลติดต่อ",
    typeContactDescription: "บันทึกเป็นรายชื่อ",
    typeLocation: "ตำแหน่ง",
    typeLocationDescription: "เปิดในแผนที่",
    workspaceAria: "ตั้งค่า QR โค้ด",
    qrTypeAria: "ประเภท QR",
    previewAria: "ตัวอย่างและการดาวน์โหลด QR",
    workspaceKicker: "ประเภท QR",
    workspaceQuestion: "ต้องการให้ QR โค้ดเปิดอะไร",
    livePreview: "ตัวอย่าง",
    directCode: "ดูตัวอย่างก่อนดาวน์โหลด",
    browserOnly: "อัปเดตทันทีบนอุปกรณ์นี้",
    updating: "กำลังอัปเดต",
    detailsSuffix: "",
    requiredCaption: "ช่องที่ต้องกรอกจะแจ้งเมื่อข้อมูลไม่ถูกต้อง",
    reliableHeading: "ตั้งค่าให้สแกนได้ดี",
    reliableCaption: "ค่าเริ่มต้นที่แนะนำ",
    logoHeading: "โลโก้ตรงกลาง (ไม่บังคับ)",
    logoCaption: "ฝังในอุปกรณ์นี้",
    websiteAddress: "ลิงก์เว็บไซต์",
    websitePlaceholder: "https://example.com",
    websiteHint: "ใส่ลิงก์เต็ม เช่น https://theerapat.org",
    textToEncode: "ข้อความที่ต้องการใส่ใน QR โค้ด",
    textPlaceholder: "โน้ต คำแนะนำ หรือข้อความสั้น ๆ",
    emailAddress: "อีเมล",
    emailPlaceholder: "hello@example.com",
    subjectOptional: "หัวข้อ (ไม่บังคับ)",
    subjectPlaceholder: "สวัสดีจาก JaneQ",
    messageOptional: "ข้อความ (ไม่บังคับ)",
    messagePlaceholder: "เขียนข้อความที่ต้องการใส่ไว้ล่วงหน้า",
    phoneNumber: "หมายเลขโทรศัพท์",
    phonePlaceholder: "+66 81 234 5678",
    phoneHint: "ใส่รหัสประเทศเมื่อต้องแชร์ข้ามประเทศ",
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
    hiddenNetwork: "เครือข่ายนี้ซ่อนอยู่",
    wifiPrivacy:
      "ข้อมูล Wi-Fi จะประมวลผลในเบราว์เซอร์นี้เท่านั้น JaneQ ไม่ส่งหรือบันทึกข้อมูลนี้",
    name: "ชื่อ",
    namePlaceholder: "Jane Appleseed",
    organizationOptional: "องค์กร (ไม่บังคับ)",
    organizationPlaceholder: "Theerapat.org",
    latitude: "ละติจูด",
    latitudePlaceholder: "13.7563",
    latitudeHint: "ระหว่าง -90 ถึง 90",
    longitude: "ลองจิจูด",
    longitudePlaceholder: "100.5018",
    longitudeHint: "ระหว่าง -180 ถึง 180",
    labelOptional: "ป้ายกำกับ (ไม่บังคับ)",
    labelPlaceholder: "กรุงเทพฯ",
    foreground: "สีด้านหน้า",
    background: "สีพื้นหลัง",
    transparent: "พื้นหลังโปร่งใส",
    transparentValue: "โปร่งใส",
    transparentDescription: "เหมาะสำหรับวาง QR โค้ดบนพื้นเรียบ",
    errorCorrection: "ระดับการแก้ไขข้อผิดพลาด",
    correctionLow: "ต่ำ · เล็กที่สุด",
    correctionMedium: "กลาง · ค่าเริ่มต้น",
    correctionQuartile: "สูงขึ้น · กู้คืนได้มากขึ้น",
    correctionHigh: "สูง · เหมาะกับโลโก้",
    outputSize: "ขนาดไฟล์",
    quietZone: "ระยะขอบเงียบ",
    modules: "โมดูล",
    moduleShape: "รูปร่างโมดูล",
    squareModules: "โมดูลสี่เหลี่ยม",
    roundedModules: "โมดูลมุมมน",
    noLogo: "ไม่มีโลโก้",
    presetLogo: "โลโก้ theerapat.org",
    uploadLogo: "อัปโหลดโลโก้",
    processing: "กำลังประมวลผล…",
    logoUsing:
      "กำลังใช้ {{name}} โลโก้มีขนาด 18% ของ QR โค้ดและเว้นพื้นที่รอบโลโก้เพื่อให้สแกนได้",
    logoProcessed:
      "ประมวลผลโลโก้ในอุปกรณ์นี้และฝังไว้ในเซสชันเบราว์เซอร์เท่านั้น",
    emptyPreview: "ตัวอย่างจะแสดงที่นี่",
    drawingCode: "กำลังสร้าง QR โค้ด",
    emptyPrompt: "กรอกข้อมูลทางซ้าย แล้ว JaneQ จะสร้าง QR โค้ดบนอุปกรณ์นี้",
    readyDownload: "พร้อมดาวน์โหลด",
    needsInput: "ตรวจสอบข้อมูล",
    waitingInput: "รอข้อมูล",
    directPayload: "ไม่ผ่านลิงก์ JaneQ",
    noAccount: "ไม่ต้องสมัครสมาชิก",
    noExpiry: "ไฟล์ทำงานได้เอง",
    statusValid: "QR โค้ดนี้มีข้อมูลปลายทางโดยตรง เมื่อสแกนแล้วจะไม่ผ่าน JaneQ",
    statusWaiting: "ปุ่มดาวน์โหลดจะใช้ได้เมื่อข้อมูลถูกต้อง",
    png: "PNG",
    svg: "SVG",
    copyImage: "คัดลอกรูปภาพ",
    copyContent: "คัดลอกข้อมูล",
    print: "พิมพ์",
    staticLabel: "ข้อจำกัดของ QR โค้ดแบบตรง",
    staticBody:
      "หลังดาวน์โหลด ปลายทางของ QR โค้ดนี้เปลี่ยนไม่ได้ หากต้องการใช้ปลายทางใหม่ ให้สร้าง QR โค้ดใหม่",
    payloadLabel: "ข้อมูลใน QR โค้ด",
    noContent: "ยังไม่มีข้อมูล",
    errorUrl: "ใส่ลิงก์ที่ถูกต้อง เช่น https://example.com",
    hintUrlNormalized:
      "JaneQ จะเขียน {{url}} ลงใน QR โค้ด โดยเติม https:// ให้",
    hintUrlDirect: "JaneQ จะเขียนลิงก์นี้ลงใน QR โค้ดโดยตรง",
    errorText: "ใส่ข้อความที่ต้องการเข้ารหัส",
    hintText: "ข้อความจะถูกใส่ใน QR โค้ดตามที่กรอก",
    errorEmail: "ใส่อีเมลที่ถูกต้อง",
    hintEmail: "ลิงก์ mailto จะเปิดแอปอีเมล",
    errorPhone: "ใส่หมายเลขโทรศัพท์ที่มีตัวเลข 5–15 หลัก",
    hintPhone: "หมายเลขจะถูกเขียนลงใน QR โค้ดโดยตรง JaneQ จะไม่โทรออก",
    errorSms: "ใส่หมายเลขโทรศัพท์ที่มีตัวเลข 5–15 หลัก",
    errorSmsMessage: "เพิ่มข้อความสำหรับ QR โค้ด SMS",
    hintSms: "QR โค้ดจะเปิดหน้าส่ง SMS พร้อมข้อความที่กรอกไว้",
    errorWifiSsid: "ใส่ชื่อเครือข่าย (SSID)",
    errorWifiPassword: "ใส่รหัสผ่าน Wi-Fi หรือเลือก ไม่มีรหัสผ่าน",
    hintWifi: "ข้อมูล Wi-Fi อยู่ในเบราว์เซอร์นี้และไม่ถูกอัปโหลด",
    errorContactEmpty:
      "เพิ่มชื่อ หมายเลขโทรศัพท์ หรืออีเมลอย่างน้อยหนึ่งรายการ",
    errorContactPhone: "ตรวจสอบหมายเลขโทรศัพท์ของข้อมูลติดต่อ",
    errorContactEmail: "ตรวจสอบอีเมลของข้อมูลติดต่อ",
    hintContact: "ข้อมูลติดต่อจะถูกเขียนลงในภาพ QR โดยตรง",
    errorLatitude: "ใส่ละติจูดระหว่าง -90 ถึง 90",
    errorLongitude: "ใส่ลองจิจูดระหว่าง -180 ถึง 180",
    hintLocation: "ตำแหน่งจะเปิดในแอปแผนที่ที่รองรับลิงก์ geo",
    warningContrastTitle: "คอนทราสต์ต่ำ",
    warningContrastBody:
      "สีชุดนี้มีคอนทราสต์ {{ratio}}:1 ควรใช้สี QR ที่เข้มกว่านี้เมื่อเทียบกับพื้นหลัง",
    infoTransparentTitle: "พื้นหลังโปร่งใส",
    infoTransparentBody:
      "วาง QR โค้ดที่ดาวน์โหลดบนพื้นสว่างและเรียบ เพื่อให้ระยะขอบมองเห็นได้",
    warningQuietTitle: "ระยะขอบแคบ",
    warningQuietBody:
      "ควรมีระยะขอบอย่างน้อย 4 โมดูล เพื่อให้เครื่องสแกนแยก QR โค้ดออกจากพื้นหลังได้",
    warningResolutionTitle: "ไฟล์มีขนาดเล็ก",
    warningResolutionBody:
      "ใช้ขนาดอย่างน้อย 256 px เพื่อความน่าเชื่อถือบนหน้าจอหรือสิ่งพิมพ์",
    infoRoundedTitle: "เปิดใช้โมดูลมุมมน",
    infoRoundedBody:
      "โมดูลมุมมนยังอยู่ภายในแต่ละช่อง ควรทดสอบ QR โค้ดที่ขนาดใช้งานจริง",
    warningLogoTitle: "ใช้การแก้ไขระดับสูงเมื่อใส่โลโก้",
    warningLogoBody:
      "การแก้ไขระดับสูงช่วยให้ QR โค้ดกู้คืนได้ดีขึ้นเมื่อมีโลโก้ตรงกลาง JaneQ ยังสร้าง QR โค้ดนี้ให้ได้",
    noticeDownloadPng:
      "ดาวน์โหลด PNG แล้ว ไฟล์ทำงานได้โดยไม่ต้องเชื่อมต่อกับ JaneQ",
    noticeDownloadSvg: "ดาวน์โหลด SVG แล้ว ภาพยังคมชัดทุกขนาด",
    noticeCopyContent: "คัดลอกข้อมูลใน QR โค้ดแล้ว",
    noticeCopyImage: "คัดลอกรูปภาพ QR แล้ว",
    noticeClipboardBlocked:
      "เบราว์เซอร์ไม่อนุญาตให้ใช้คลิปบอร์ด เลือกข้อความปลายทางเพื่อคัดลอกเอง",
    noticeImageUnsupported:
      "เบราว์เซอร์นี้ไม่รองรับการคัดลอกรูปภาพ ให้ดาวน์โหลด PNG แทน",
    noticeImageBlocked:
      "เบราว์เซอร์ไม่อนุญาตให้คัดลอกรูปภาพ ให้ดาวน์โหลด PNG แทน",
    noticePrintBlocked:
      "เบราว์เซอร์บล็อกการพิมพ์ อนุญาตป๊อปอัปของ JaneQ แล้วลองอีกครั้ง",
    noticePrintOpened: "เปิดหน้าสำหรับพิมพ์ในแท็บใหม่แล้ว",
    noticeLogoProcessing:
      "ประมวลผลโลโก้ในอุปกรณ์นี้และฝังไว้ในเซสชันเบราว์เซอร์เท่านั้น",
    noticePngFallback:
      "ตัวอย่างเวกเตอร์พร้อมแล้ว แต่เบราว์เซอร์นี้เตรียมไฟล์ PNG ไม่ได้",
    noticeTooLarge:
      "ข้อมูลนี้ยาวเกินกว่าจะสร้าง QR โค้ดได้ ลองลดข้อความหรือลดระดับการแก้ไขข้อผิดพลาด",
    errorLogoType: "เลือกไฟล์ PNG, JPEG หรือ WebP",
    errorLogoSize: "ไฟล์โลโก้ต้องมีขนาดไม่เกิน 2 MB",
    errorLogoDecode: "อ่านไฟล์ภาพนี้ไม่ได้",
    errorLogoDimensions: "ไฟล์ภาพไม่มีขนาดที่อ่านได้",
    errorLogoProcess: "ประมวลผลภาพในอุปกรณ์นี้ไม่ได้",
    errorCanvas: "เบราว์เซอร์นี้ไม่รองรับการวาดด้วย Canvas",
    printCaption: "สร้างด้วย JaneQ — ตรงถึงปลายทาง ใช้ต่อได้หลังดาวน์โหลด",
    altQr: "QR โค้ดสำหรับ {{label}}",
    errorBoundaryEyebrow: "เครื่องมือบนอุปกรณ์ขัดข้องชั่วคราว",
    errorBoundaryHeading: "ลองโหลดตัวสร้างใหม่",
    errorBoundaryBody:
      "ไม่มีข้อมูล QR ถูกส่งออกไป ลองเปิดหน้านี้อีกครั้ง แล้วเบราว์เซอร์จะสร้างพื้นที่ทำงานใหม่",
    tryAgain: "ลองอีกครั้ง",
    notFoundEyebrow: "404 / ไม่พบปลายทาง",
    notFoundHeading: "หน้านี้หายไปแล้ว",
    notFoundBody: "ตัวสร้าง JaneQ ยังอยู่ที่เดิม",
    backToJaneq: "กลับไป JaneQ",
  },
};

export type TranslationKey = keyof typeof strings.en;

export function translate(
  locale: Locale,
  key: TranslationKey,
  values: Record<string, string | number> = {},
): string {
  let value = strings[locale][key] ?? strings.en[key] ?? key;
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
  }
  if (result.hint) {
    if (type === "url") {
      const missingProtocol = !/^https?:\/\//i.test(fields.url.trim());
      hint = translate(
        locale,
        missingProtocol ? "hintUrlNormalized" : "hintUrlDirect",
        missingProtocol ? { url: result.payload ?? "" } : {},
      );
    }
    if (type === "text") hint = translate(locale, "hintText");
    if (type === "email") hint = translate(locale, "hintEmail");
    if (type === "phone") hint = translate(locale, "hintPhone");
    if (type === "sms") hint = translate(locale, "hintSms");
    if (type === "wifi") hint = translate(locale, "hintWifi");
    if (type === "contact") hint = translate(locale, "hintContact");
    if (type === "location") hint = translate(locale, "hintLocation");
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
