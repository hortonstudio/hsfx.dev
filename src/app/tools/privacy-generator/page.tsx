"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Button, Input, Switch, Label } from "@/components/ui";

// ════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════

interface DataCategory {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  retention: string;
}

interface SectionToggles {
  googleAnalytics: boolean;
  cookies: boolean;
  targetedAdvertising: boolean;
  marketingCommunications: boolean;
  internationalTransfer: boolean;
  userAccounts: boolean;
  locationData: boolean;
}

interface PolicyConfig {
  companyName: string;
  contactEmail: string;
  includeSms: boolean;
  sections: SectionToggles;
  categories: DataCategory[];
}

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════

const DEFAULT_RETENTION = "As long as the user has an account with us";

const INITIAL_CATEGORIES: DataCategory[] = [
  {
    key: "A",
    label: "Identifiers",
    description:
      "Contact details, such as real name, alias, postal address, telephone or mobile contact number, unique personal identifier, online identifier, Internet Protocol address, email address, and account name",
    enabled: true,
    retention: DEFAULT_RETENTION,
  },
  {
    key: "B",
    label: "Personal information (California Customer Records)",
    description:
      "Name, contact information, education, employment, employment history, and financial information",
    enabled: true,
    retention: DEFAULT_RETENTION,
  },
  {
    key: "C",
    label: "Protected classification characteristics",
    description:
      "Gender, age, date of birth, race and ethnicity, national origin, marital status, and other demographic data",
    enabled: false,
    retention: DEFAULT_RETENTION,
  },
  {
    key: "D",
    label: "Commercial information",
    description:
      "Transaction information, purchase history, financial details, and payment information",
    enabled: false,
    retention: DEFAULT_RETENTION,
  },
  {
    key: "E",
    label: "Biometric information",
    description: "Fingerprints and voiceprints",
    enabled: false,
    retention: DEFAULT_RETENTION,
  },
  {
    key: "F",
    label: "Internet or similar network activity",
    description:
      "Browsing history, search history, online behavior, interest data, and interactions with our and other websites, applications, systems, and advertisements",
    enabled: false,
    retention: DEFAULT_RETENTION,
  },
  {
    key: "G",
    label: "Geolocation data",
    description: "Device location",
    enabled: false,
    retention: DEFAULT_RETENTION,
  },
  {
    key: "H",
    label: "Audio, electronic, sensory, or similar information",
    description:
      "Images and audio, video or call recordings created in connection with our business activities",
    enabled: false,
    retention: DEFAULT_RETENTION,
  },
  {
    key: "I",
    label: "Professional or employment-related information",
    description:
      "Business contact details in order to provide you our Services at a business level or job title, work history, and professional qualifications if you apply for a job with us",
    enabled: false,
    retention: DEFAULT_RETENTION,
  },
  {
    key: "J",
    label: "Education Information",
    description: "Student records and directory information",
    enabled: false,
    retention: DEFAULT_RETENTION,
  },
  {
    key: "K",
    label: "Inferences drawn from collected personal information",
    description:
      "Inferences drawn from any of the collected personal information listed above to create a profile or summary about, for example, an individual's preferences and characteristics",
    enabled: false,
    retention: DEFAULT_RETENTION,
  },
  {
    key: "L",
    label: "Sensitive personal Information",
    description: "",
    enabled: false,
    retention: DEFAULT_RETENTION,
  },
];

// ════════════════════════════════════════════════════════════
// HTML ESCAPING
// ════════════════════════════════════════════════════════════

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ════════════════════════════════════════════════════════════
// POLICY GENERATORS
// ════════════════════════════════════════════════════════════

function generatePolicyHTML(config: PolicyConfig): string {
  const company = escapeHtml(config.companyName || "[Company Name]");
  const email = escapeHtml(config.contactEmail || "[email@example.com]");
  const s = config.sections;
  const enabledCategories = config.categories.filter((c) => c.enabled);

  const categoriesSection = config.categories
    .map((cat) => {
      const status = cat.enabled ? "YES" : "NO";
      const desc = cat.description
        ? `<br/>${escapeHtml(cat.description)}`
        : "";
      return `<p><strong>${escapeHtml(cat.key)}. ${escapeHtml(cat.label)}</strong>${desc}</p>\n<p>${status}</p>`;
    })
    .join("\n\n");

  const retentionLines = enabledCategories
    .map(
      (cat) =>
        `<li>Category ${escapeHtml(cat.key)} - ${escapeHtml(cat.retention)}</li>`
    )
    .join("\n");

  const smsSection = config.includeSms
    ? `<h3>SMS DATA SHARING</h3>
<p>No mobile information will be shared with third parties/affiliates for marketing/promotional purposes. Information sharing to subcontractors in support services, such as customer service is permitted. All other use case categories exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties.</p>`
    : "";

  return `<h1>Privacy Policy</h1>

<p>This privacy policy for ${company} (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), describes how and why we might collect, store, use, and/or share (&ldquo;process&rdquo;) your information when you use our services (&ldquo;Services&rdquo;), such as when you:</p>

<ul>
<li>Visit our website, or any website of ours that links to this privacy notice</li>
<li>Engage with us in other related ways, including any sales, marketing, or events</li>
</ul>

<p><strong>Questions or concerns?</strong> Reading this privacy notice will help you understand your privacy rights and choices. If you do not agree with our policies and practices, please do not use our Services.</p>

<h2>SUMMARY OF KEY POINTS</h2>

<p>This summary provides key points from our privacy policy, but you can find out more details about any of these topics by clicking the link following each key point or by using our table of contents below to find the section you are looking for.</p>

<p><strong>What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use.</p>

<p><strong>Do we process any sensitive personal information?</strong> We may process sensitive personal information when necessary with your consent or as otherwise permitted by applicable law.</p>

<p><strong>Do we collect any information from third parties?</strong> We do not collect any information from third parties.</p>

<p><strong>How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent. We process your information only when we have a valid legal reason to do so.</p>

<p><strong>In what situations and with which parties do we share personal information?</strong> We may share information in specific situations and with specific third parties.</p>

<p><strong>How do we keep your information safe?</strong> We have organizational and technical processes and procedures in place to protect your personal information. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information.</p>

<p><strong>What are your rights?</strong> Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information.</p>

<p><strong>How do you exercise your rights?</strong> The easiest way to exercise your rights is by submitting a data subject access request, or by contacting us. We will consider and act upon any request in accordance with applicable data protection laws.</p>

<p>Want to learn more about what we do with any information we collect? Review the privacy policy in full.</p>

<h2>TABLE OF CONTENTS</h2>
<ol>
<li>WHAT INFORMATION DO WE COLLECT?</li>
<li>HOW DO WE PROCESS YOUR INFORMATION?</li>
<li>WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR PERSONAL INFORMATION?</li>
<li>WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</li>
<li>DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</li>
<li>IS YOUR INFORMATION TRANSFERRED INTERNATIONALLY?</li>
<li>HOW LONG DO WE KEEP YOUR INFORMATION?</li>
<li>HOW DO WE KEEP YOUR INFORMATION SAFE?</li>
<li>DO WE COLLECT INFORMATION FROM MINORS?</li>
<li>WHAT ARE YOUR PRIVACY RIGHTS?</li>
<li>CONTROLS FOR DO-NOT-TRACK FEATURES</li>
<li>DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</li>
<li>DO WE MAKE UPDATES TO THIS NOTICE?</li>
<li>HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</li>
<li>HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</li>
</ol>

<h2>1. WHAT INFORMATION DO WE COLLECT?</h2>

<h3>Personal information you disclose to us</h3>

<p><strong>In Short:</strong> We collect personal information that you provide to us.</p>

<p>We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.</p>

<p><strong>Personal Information Provided by You.</strong> The personal information that we collect depends on the context of your interactions with us and the Services, the choices you make, and the products and features you use. The personal information we collect may include the following:</p>

<ul>
<li>names</li>
<li>phone numbers</li>
<li>email addresses</li>
<li>usernames</li>
<li>passwords</li>
<li>contact preferences</li>
<li>contact or authentication data</li>
<li>billing addresses</li>
<li>debit/credit card numbers</li>
</ul>

<h3>Information automatically collected</h3>

<p><strong>In Short:</strong> Some information &mdash; such as your Internet Protocol (IP) address and/or browser and device characteristics &mdash; is collected automatically when you visit our Services.</p>

<p>We automatically collect certain information when you visit, use, or navigate the Services. This information does not reveal your specific identity (like your name or contact information) but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, information about how and when you use our Services, and other technical information. This information is primarily needed to maintain the security and operation of our Services, and for our internal analytics and reporting purposes.</p>

<p>The information we collect includes:</p>

<ul>
<li><strong>Log and Usage Data.</strong> Log and usage data is service-related, diagnostic, usage, and performance information our servers automatically collect when you access or use our Services and which we record in log files. Depending on how you interact with us, this log data may include your IP address, device information, browser type, and settings and information about your activity in the Services (such as the date/time stamps associated with your usage, pages and files viewed, searches, and other actions you take such as which features you use), device event information (such as system activity, error reports (sometimes called &ldquo;crash dumps&rdquo;), and hardware settings).</li>
<li><strong>Device Data.</strong> We collect device data such as information about your computer, phone, tablet, or other device you use to access the Services. Depending on the device used, this device data may include information such as your IP address (or proxy server), device and application identification numbers, location, browser type, hardware model, Internet service provider and/or mobile carrier, operating system, and system configuration information.</li>
${s.locationData ? `<li><strong>Location Data.</strong> We collect location data such as information about your device&rsquo;s location, which can be either precise or imprecise. How much information we collect depends on the type and settings of the device you use to access the Services. For example, we may use GPS and other technologies to collect geolocation data that tells us your current location (based on your IP address). You can opt out of allowing us to collect this information either by refusing access to the information or by disabling your Location setting on your device. However, if you choose to opt out, you may not be able to use certain aspects of the Services.</li>` : ""}
</ul>

<h2>2. HOW DO WE PROCESS YOUR INFORMATION?</h2>

<p><strong>In Short:</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent.</p>

<p>We process your personal information for a variety of reasons, depending on how you interact with our Services, including:</p>

<ul>
${s.userAccounts ? `<li><strong>To facilitate account creation and authentication and otherwise manage user accounts.</strong> We may process your information so you can create and log in to your account, as well as keep your account in working order.</li>` : ""}
<li><strong>To deliver and facilitate delivery of services to the user.</strong> We may process your information to provide you with the requested service.</li>
<li><strong>To respond to user inquiries/offer support to users.</strong> We may process your information to respond to your inquiries and solve any potential issues you might have with the requested service.</li>
<li><strong>To send administrative information to you.</strong> We may process your information to send you details about our products and services, changes to our terms and policies, and other similar information.</li>
<li><strong>To fulfill and manage your orders.</strong> We may process your information to fulfill and manage your orders, payments, returns, and exchanges made through the Services.</li>
<li><strong>To enable user-to-user communications.</strong> We may process your information if you choose to use any of our offerings that allow for communication with another user.</li>
<li><strong>To request feedback.</strong> We may process your information when necessary to request feedback and to contact you about your use of our Services.</li>
${s.marketingCommunications ? `<li><strong>To send you marketing and promotional communications.</strong> We may process the personal information you send to us for our marketing purposes, if this is in accordance with your marketing preferences. You can opt out of our marketing emails at any time. For more information, see &ldquo;WHAT ARE YOUR PRIVACY RIGHTS?&rdquo; below.</li>` : ""}
${s.targetedAdvertising ? `<li><strong>To deliver targeted advertising to you.</strong> We may process your information to develop and display personalized content and advertising tailored to your interests, location, and more.</li>` : ""}
<li><strong>To protect our Services.</strong> We may process your information as part of our efforts to keep our Services safe and secure, including fraud monitoring and prevention.</li>
<li><strong>To identify usage trends.</strong> We may process information about how you use our Services to better understand how they are being used so we can improve them.</li>
<li><strong>To determine the effectiveness of our marketing and promotional campaigns.</strong> We may process your information to better understand how to provide marketing and promotional campaigns that are most relevant to you.</li>
<li><strong>To save or protect an individual&rsquo;s vital interest.</strong> We may process your information when necessary to save or protect an individual&rsquo;s vital interest, such as to prevent harm.</li>
</ul>

<h2>3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR INFORMATION?</h2>

<p><strong>In Short:</strong> We only process your personal information when we believe it is necessary and we have a valid legal reason (i.e., legal basis) to do so under applicable law, like with your consent, to comply with laws, to provide you with services to enter into or fulfill our contractual obligations, to protect your rights, or to fulfill our legitimate business interests.</p>

<h2>4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</h2>

<p><strong>In Short:</strong> We may share information in specific situations described in this section and/or with the following third parties.</p>

<h3>Vendors, Consultants, and Other Third-Party Service Providers</h3>

<p>We may share your data with third-party vendors, service providers, contractors, or agents (&ldquo;third parties&rdquo;) who perform services for us or on our behalf and require access to such information to do that work. We have contracts in place with our third parties, which are designed to help safeguard your personal information. This means that they cannot do anything with your personal information unless we have instructed them to do it. They will also not share your personal information with any organization apart from us. They also commit to protect the data they hold on our behalf and to retain it for the period we instruct.</p>

<p>We also may need to share your personal information in the following situations:</p>

<ul>
<li><strong>Business Transfers.</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
<li><strong>Affiliates.</strong> We may share your information with our affiliates, in which case we will require those affiliates to honor this privacy notice. Affiliates include our parent company and any subsidiaries, joint venture partners, or other companies that we control or that are under common control with us.</li>
<li><strong>Business Partners.</strong> We may share your information with our business partners to offer you certain products, services, or promotions.</li>
<li><strong>Other Users.</strong> When you share personal information or otherwise interact with public areas of the Services, such personal information may be viewed by all users and may be publicly made available outside the Services in perpetuity. Similarly, other users will be able to view descriptions of your activity, communicate with you within our Services, and view your profile.</li>
</ul>

${smsSection}

${s.cookies ? `<h2>5. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</h2>

<p><strong>In Short:</strong> We may use cookies and other tracking technologies to collect and store your information.</p>

<p>We may use cookies and similar tracking technologies (like web beacons and pixels) to gather information when you interact with our Services. Some online tracking technologies help us maintain the security of our Services and your account, prevent crashes, fix bugs, save your preferences, and assist with basic site functions.</p>

<p>We also permit third parties and service providers to use online tracking technologies on our Services for analytics and advertising, including to help manage and display advertisements, to tailor advertisements to your interests, or to send abandoned shopping cart reminders (depending on your communication preferences). The third parties and service providers use their technology to provide advertising about products and services tailored to your interests which may appear either on our Services or on other websites.</p>

<p>To the extent these online tracking technologies are deemed to be a &ldquo;sale&rdquo;/&ldquo;sharing&rdquo; (which includes targeted advertising, as defined under the applicable laws) under applicable US state laws, you can opt out of these online tracking technologies by submitting a request as described below under section &ldquo;DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?&rdquo;</p>

<p>Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Notice.</p>

${s.googleAnalytics ? `<h3>Google Analytics</h3>

<p>We may share your information with Google Analytics to track and analyze the use of the Services. The Google Analytics Advertising Features that we may use include: Google Analytics Demographics and Interests Reporting. To opt out of being tracked by Google Analytics across the Services, visit <a href="https://tools.google.com/dlpage/gaoptout">https://tools.google.com/dlpage/gaoptout</a>. You can opt out of Google Analytics Advertising Features through Ads Settings and Ad Settings for mobile apps. Other opt out means include <a href="http://optout.networkadvertising.org/">http://optout.networkadvertising.org/</a> and <a href="http://www.networkadvertising.org/mobile-choice">http://www.networkadvertising.org/mobile-choice</a>. For more information on the privacy practices of Google, please visit the Google Privacy &amp; Terms page.</p>` : ""}` : ""}

${s.internationalTransfer ? `<h2>6. IS YOUR INFORMATION TRANSFERRED INTERNATIONALLY?</h2>

<p><strong>In Short:</strong> We may transfer, store, and process your information in countries other than your own.</p>

<p>Our servers are located in the United States. If you are accessing our Services from outside, please be aware that your information may be transferred to, stored, and processed by us in our facilities and by those third parties with whom we may share your personal information (see &ldquo;WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?&rdquo; above), in the United States and other countries.</p>

<p>If you are a resident in the European Economic Area (EEA), United Kingdom (UK), or Switzerland, then these countries may not necessarily have data protection laws or other similar laws as comprehensive as those in your country. However, we will take all necessary measures to protect your personal information in accordance with this privacy notice and applicable law.</p>` : ""}

<h2>7. HOW LONG DO WE KEEP YOUR INFORMATION?</h2>

<p><strong>In Short:</strong> We keep your information for as long as necessary to fulfill the purposes outlined in this privacy notice unless otherwise required by law.</p>

<p>We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements). No purpose in this notice will require us keeping your personal information for longer than the period of time in which users have an account with us.</p>

<p>When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize such information, or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible.</p>

<h2>8. HOW DO WE KEEP YOUR INFORMATION SAFE?</h2>

<p><strong>In Short:</strong> We aim to protect your personal information through a system of organizational and technical security measures.</p>

<p>We have implemented appropriate and reasonable technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information. Although we will do our best to protect your personal information, transmission of personal information to and from our Services is at your own risk. You should only access the Services within a secure environment.</p>

<h2>9. DO WE COLLECT INFORMATION FROM MINORS?</h2>

<p><strong>In Short:</strong> We do not knowingly collect data from or market to children under 18 years of age.</p>

<p>We do not knowingly collect, solicit data from, or market to children under 18 years of age, nor do we knowingly sell such personal information. By using the Services, you represent that you are at least 18 or that you are the parent or guardian of such a minor and consent to such minor dependent&rsquo;s use of the Services. If we learn that personal information from users less than 18 years of age has been collected, we will deactivate the account and take reasonable measures to promptly delete such data from our records.</p>

<h2>10. WHAT ARE YOUR PRIVACY RIGHTS?</h2>

<p><strong>In Short:</strong> Depending on your state of residence in the US or in some regions, such as the European Economic Area (EEA), United Kingdom (UK), Switzerland, and Canada, you have rights that allow you greater access to and control over your personal information. You may review, change, or terminate your account at any time, depending on your country, province, or state of residence.</p>

<p>In some regions (like the EEA, UK, Switzerland, and Canada), you have certain rights under applicable data protection laws. These may include the right (i) to request access and obtain a copy of your personal information, (ii) to request rectification or erasure; (iii) to restrict the processing of your personal information; (iv) if applicable, to data portability; and (v) not to be subject to automated decision-making. In certain circumstances, you may also have the right to object to the processing of your personal information. You can make such a request by contacting us by using the contact details provided in the section &ldquo;HOW CAN YOU CONTACT US ABOUT THIS NOTICE?&rdquo; below.</p>

<p>We will consider and act upon any request in accordance with applicable data protection laws.</p>

<p>If you are located in the EEA or UK and you believe we are unlawfully processing your personal information, you also have the right to complain to your Member State data protection authority or UK data protection authority.</p>

<p>If you are located in Switzerland, you may contact the Federal Data Protection and Information Commissioner.</p>

<h3>Withdrawing your consent</h3>

<p>If we are relying on your consent to process your personal information, which may be express and/or implied consent depending on the applicable law, you have the right to withdraw your consent at any time. You can withdraw your consent at any time by contacting us by using the contact details provided in the section &ldquo;HOW CAN YOU CONTACT US ABOUT THIS NOTICE?&rdquo; below.</p>

<p>However, please note that this will not affect the lawfulness of the processing before its withdrawal nor, when applicable law allows, will it affect the processing of your personal information conducted in reliance on lawful processing grounds other than consent.</p>

${s.marketingCommunications ? `<h3>Opting out of marketing and promotional communications</h3>

<p>You can unsubscribe from our marketing and promotional communications at any time by clicking on the unsubscribe link in the emails that we send, replying &ldquo;STOP&rdquo; or &ldquo;UNSUBSCRIBE&rdquo; to the SMS messages that we send, or by contacting us using the details provided in the section &ldquo;HOW CAN YOU CONTACT US ABOUT THIS NOTICE?&rdquo; below. You will then be removed from the marketing lists. However, we may still communicate with you &mdash; for example, to send you service-related messages that are necessary for the administration and use of your account, to respond to service requests, or for other non-marketing purposes.</p>` : ""}

${s.userAccounts ? `<h3>Account Information</h3>

<p>If you would at any time like to review or change the information in your account or terminate your account, you can:</p>

<ul>
<li>Contact us using the contact information provided.</li>
</ul>

<p>Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, we may retain some information in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our legal terms and/or comply with applicable legal requirements.</p>` : ""}

<h2>11. CONTROLS FOR DO-NOT-TRACK FEATURES</h2>

<p>Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track (&ldquo;DNT&rdquo;) feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage, no uniform technology standard for recognizing and implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online. If a standard for online tracking is adopted that we must follow in the future, we will inform you about that practice in a revised version of this privacy notice.</p>

<p>California law requires us to let you know how we respond to web browser DNT signals. Because there currently is not an industry or legal standard for recognizing or honoring DNT signals, we do not respond to them at this time.</p>

<h2>12. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</h2>

<p><strong>In Short:</strong> If you are a resident of California, Colorado, Connecticut, Delaware, Florida, Indiana, Iowa, Kentucky, Montana, New Hampshire, New Jersey, Oregon, Tennessee, Texas, Utah, or Virginia, you may have the right to request access to and receive details about the personal information we maintain about you and how we have processed it, correct inaccuracies, get a copy of, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law. More information is provided below.</p>

<h3>Categories of Personal Information We Collect</h3>

<p>We have collected the following categories of personal information in the past twelve (12) months:</p>

${categoriesSection}

<p>We may also collect other personal information outside of these categories through instances where you interact with us in person, online, or by phone or mail in the context of:</p>

<ul>
<li>Receiving help through our customer support channels;</li>
<li>Participation in customer surveys or contests; and</li>
<li>Facilitation in the delivery of our Services and to respond to your inquiries.</li>
</ul>

<p>We will use and retain the collected personal information as needed to provide the Services or for:</p>

<ul>
${retentionLines}
</ul>

<h3>Sources of Personal Information</h3>

<p>Learn more about the sources of personal information we collect in &ldquo;WHAT INFORMATION DO WE COLLECT?&rdquo;</p>

<h3>How We Use and Share Personal Information</h3>

<p>Learn about how we use your personal information in the section, &ldquo;HOW DO WE PROCESS YOUR INFORMATION?&rdquo;</p>

<h3>Will your information be shared with anyone else?</h3>

<p>We may disclose your personal information with our service providers pursuant to a written contract between us and each service provider. Learn more about how we disclose personal information in the section, &ldquo;WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?&rdquo;</p>

<p>We may use your personal information for our own business purposes, such as for undertaking internal research for technological development and demonstration. This is not considered to be &ldquo;selling&rdquo; of your personal information.</p>

<p>We have not sold or shared any personal information to third parties for a business or commercial purpose in the preceding twelve (12) months. We have disclosed the following categories of personal information to third parties for a business or commercial purpose in the preceding twelve (12) months:</p>

<p>The categories of third parties to whom we disclosed personal information for a business or commercial purpose can be found under &ldquo;WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?&rdquo;</p>

<h3>Your Rights</h3>

<p>You have rights under certain US state data protection laws. However, these rights are not absolute, and in certain cases, we may decline your request as permitted by law. These rights include:</p>

<ul>
<li>Right to know whether or not we are processing your personal data</li>
<li>Right to access your personal data</li>
<li>Right to correct inaccuracies in your personal data</li>
<li>Right to request the deletion of your personal data</li>
<li>Right to obtain a copy of the personal data you previously shared with us</li>
<li>Right to non-discrimination for exercising your rights</li>
<li>Right to opt out of the processing of your personal data if it is used for targeted advertising (or sharing as defined under California&rsquo;s privacy law), the sale of personal data, or profiling in furtherance of decisions that produce legal or similarly significant effects (&ldquo;profiling&rdquo;)</li>
</ul>

<p>Depending upon the state where you live, you may also have the following rights:</p>

<ul>
<li>Right to obtain a list of the categories of third parties to which we have disclosed personal data (as permitted by applicable law, including California&rsquo;s and Delaware&rsquo;s privacy law)</li>
<li>Right to obtain a list of specific third parties to which we have disclosed personal data (as permitted by applicable law, including Oregon&rsquo;s privacy law)</li>
<li>Right to limit use and disclosure of sensitive personal data (as permitted by applicable law, including California&rsquo;s privacy law)</li>
<li>Right to opt out of the collection of sensitive data and personal data collected through the operation of a voice or facial recognition feature (as permitted by applicable law, including Florida&rsquo;s privacy law)</li>
</ul>

<h3>How to Exercise Your Rights</h3>

<p>To exercise these rights, you can contact us by submitting a data subject access request, by referring to the contact details at the bottom of this document.</p>

<p>Under certain US state data protection laws, you can designate an authorized agent to make a request on your behalf. We may deny a request from an authorized agent that does not submit proof that they have been validly authorized to act on your behalf in accordance with applicable laws.</p>

<h3>Request Verification</h3>

<p>Upon receiving your request, we will need to verify your identity to determine you are the same person about whom we have the information in our system. We will only use personal information provided in your request to verify your identity or authority to make the request. However, if we cannot verify your identity from the information already maintained by us, we may request that you provide additional information for the purposes of verifying your identity and for security or fraud-prevention purposes.</p>

<p>If you submit the request through an authorized agent, we may need to collect additional information to verify your identity before processing your request and the agent will need to provide a written and signed permission from you to submit such request on your behalf.</p>

<h3>Appeals</h3>

<p>Under certain US state data protection laws, if we decline to take action regarding your request, you may appeal our decision by emailing us at ${email}. We will inform you in writing of any action taken or not taken in response to the appeal, including a written explanation of the reasons for the decisions. If your appeal is denied, you may submit a complaint to your state attorney general.</p>

<h3>California &ldquo;Shine The Light&rdquo; Law</h3>

<p>California Civil Code Section 1798.83, also known as the &ldquo;Shine The Light&rdquo; law, permits our users who are California residents to request and obtain from us, once a year and free of charge, information about categories of personal information (if any) we disclosed to third parties for direct marketing purposes and the names and addresses of all third parties with which we shared personal information in the immediately preceding calendar year. If you are a California resident and would like to make such a request, please submit your request in writing to us by using the contact details provided in the section &ldquo;HOW CAN YOU CONTACT US ABOUT THIS NOTICE?&rdquo;</p>

<h2>13. DO WE MAKE UPDATES TO THIS NOTICE?</h2>

<p><strong>In Short:</strong> Yes, we will update this notice as necessary to stay compliant with relevant laws.</p>

<p>We may update this privacy notice from time to time. The updated version will be indicated by an updated &ldquo;Revised&rdquo; date at the top of this privacy notice. If we make material changes to this privacy notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this privacy notice frequently to be informed of how we are protecting your information.</p>

<h2>14. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h2>

<p>If you have questions or comments about this notice, you may contact us by post at:</p>

<p>${email}</p>

<h2>15. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</h2>

<p>Based on the applicable laws of your country or state of residence in the US, you may have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law. To request to review, update, or delete your personal information, please email us at ${email}.</p>`;
}

function generatePolicyPlainText(config: PolicyConfig): string {
  const company = config.companyName || "[Company Name]";
  const email = config.contactEmail || "[email@example.com]";
  const s = config.sections;
  const enabledCategories = config.categories.filter((c) => c.enabled);

  const categoriesSection = config.categories
    .map((cat) => {
      const status = cat.enabled ? "YES" : "NO";
      const desc = cat.description ? `\n${cat.description}` : "";
      return `${cat.key}. ${cat.label}${desc}\n\n${status}`;
    })
    .join("\n\n");

  const retentionLines = enabledCategories
    .map((cat) => `- Category ${cat.key} - ${cat.retention}`)
    .join("\n");

  const smsSection = config.includeSms
    ? `SMS DATA SHARING
No mobile information will be shared with third parties/affiliates for marketing/promotional purposes. Information sharing to subcontractors in support services, such as customer service is permitted. All other use case categories exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties.

`
    : "";

  return `PRIVACY POLICY

This privacy policy for ${company} ("we," "us," or "our"), describes how and why we might collect, store, use, and/or share ("process") your information when you use our services ("Services"), such as when you:

- Visit our website, or any website of ours that links to this privacy notice
- Engage with us in other related ways, including any sales, marketing, or events

Questions or concerns? Reading this privacy notice will help you understand your privacy rights and choices. If you do not agree with our policies and practices, please do not use our Services.

SUMMARY OF KEY POINTS

This summary provides key points from our privacy policy, but you can find out more details about any of these topics by clicking the link following each key point or by using our table of contents below to find the section you are looking for.

What personal information do we process? When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use.

Do we process any sensitive personal information? We may process sensitive personal information when necessary with your consent or as otherwise permitted by applicable law.

Do we collect any information from third parties? We do not collect any information from third parties.

How do we process your information? We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent. We process your information only when we have a valid legal reason to do so.

In what situations and with which parties do we share personal information? We may share information in specific situations and with specific third parties.

How do we keep your information safe? We have organizational and technical processes and procedures in place to protect your personal information. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information.

What are your rights? Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information.

How do you exercise your rights? The easiest way to exercise your rights is by submitting a data subject access request, or by contacting us. We will consider and act upon any request in accordance with applicable data protection laws.

Want to learn more about what we do with any information we collect? Review the privacy policy in full.

TABLE OF CONTENTS
1. WHAT INFORMATION DO WE COLLECT?
2. HOW DO WE PROCESS YOUR INFORMATION?
3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR PERSONAL INFORMATION?
4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?
5. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?
6. IS YOUR INFORMATION TRANSFERRED INTERNATIONALLY?
7. HOW LONG DO WE KEEP YOUR INFORMATION?
8. HOW DO WE KEEP YOUR INFORMATION SAFE?
9. DO WE COLLECT INFORMATION FROM MINORS?
10. WHAT ARE YOUR PRIVACY RIGHTS?
11. CONTROLS FOR DO-NOT-TRACK FEATURES
12. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?
13. DO WE MAKE UPDATES TO THIS NOTICE?
14. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?
15. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?

1. WHAT INFORMATION DO WE COLLECT?

Personal information you disclose to us

In Short: We collect personal information that you provide to us.

We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.

Personal Information Provided by You. The personal information that we collect depends on the context of your interactions with us and the Services, the choices you make, and the products and features you use. The personal information we collect may include the following:

- names
- phone numbers
- email addresses
- usernames
- passwords
- contact preferences
- contact or authentication data
- billing addresses
- debit/credit card numbers

Information automatically collected

In Short: Some information -- such as your Internet Protocol (IP) address and/or browser and device characteristics -- is collected automatically when you visit our Services.

We automatically collect certain information when you visit, use, or navigate the Services. This information does not reveal your specific identity (like your name or contact information) but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, information about how and when you use our Services, and other technical information. This information is primarily needed to maintain the security and operation of our Services, and for our internal analytics and reporting purposes.

The information we collect includes:

- Log and Usage Data. Log and usage data is service-related, diagnostic, usage, and performance information our servers automatically collect when you access or use our Services and which we record in log files.
- Device Data. We collect device data such as information about your computer, phone, tablet, or other device you use to access the Services.
${s.locationData ? `- Location Data. We collect location data such as information about your device's location, which can be either precise or imprecise.` : ""}

2. HOW DO WE PROCESS YOUR INFORMATION?

In Short: We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent.

We process your personal information for a variety of reasons, depending on how you interact with our Services, including:

${s.userAccounts ? `- To facilitate account creation and authentication and otherwise manage user accounts.` : ""}
- To deliver and facilitate delivery of services to the user.
- To respond to user inquiries/offer support to users.
- To send administrative information to you.
- To fulfill and manage your orders.
- To enable user-to-user communications.
- To request feedback.
${s.marketingCommunications ? `- To send you marketing and promotional communications.` : ""}
${s.targetedAdvertising ? `- To deliver targeted advertising to you.` : ""}
- To protect our Services.
- To identify usage trends.
- To determine the effectiveness of our marketing and promotional campaigns.
- To save or protect an individual's vital interest.

3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR INFORMATION?

In Short: We only process your personal information when we believe it is necessary and we have a valid legal reason (i.e., legal basis) to do so under applicable law, like with your consent, to comply with laws, to provide you with services to enter into or fulfill our contractual obligations, to protect your rights, or to fulfill our legitimate business interests.

4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?

In Short: We may share information in specific situations described in this section and/or with the following third parties.

Vendors, Consultants, and Other Third-Party Service Providers

We may share your data with third-party vendors, service providers, contractors, or agents ("third parties") who perform services for us or on our behalf and require access to such information to do that work. We have contracts in place with our third parties, which are designed to help safeguard your personal information. This means that they cannot do anything with your personal information unless we have instructed them to do it. They will also not share your personal information with any organization apart from us. They also commit to protect the data they hold on our behalf and to retain it for the period we instruct.

We also may need to share your personal information in the following situations:

- Business Transfers. We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.
- Affiliates. We may share your information with our affiliates, in which case we will require those affiliates to honor this privacy notice.
- Business Partners. We may share your information with our business partners to offer you certain products, services, or promotions.
- Other Users. When you share personal information or otherwise interact with public areas of the Services, such personal information may be viewed by all users and may be publicly made available outside the Services in perpetuity.

${smsSection}${s.cookies ? `5. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?

In Short: We may use cookies and other tracking technologies to collect and store your information.

We may use cookies and similar tracking technologies (like web beacons and pixels) to gather information when you interact with our Services. Some online tracking technologies help us maintain the security of our Services and your account, prevent crashes, fix bugs, save your preferences, and assist with basic site functions.

We also permit third parties and service providers to use online tracking technologies on our Services for analytics and advertising, including to help manage and display advertisements, to tailor advertisements to your interests, or to send abandoned shopping cart reminders (depending on your communication preferences).

To the extent these online tracking technologies are deemed to be a "sale"/"sharing" (which includes targeted advertising, as defined under the applicable laws) under applicable US state laws, you can opt out of these online tracking technologies by submitting a request as described below under section "DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?"

Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Notice.

${s.googleAnalytics ? `Google Analytics

We may share your information with Google Analytics to track and analyze the use of the Services. To opt out of being tracked by Google Analytics across the Services, visit https://tools.google.com/dlpage/gaoptout. For more information on the privacy practices of Google, please visit the Google Privacy & Terms page.

` : ""}` : ""}${s.internationalTransfer ? `6. IS YOUR INFORMATION TRANSFERRED INTERNATIONALLY?

In Short: We may transfer, store, and process your information in countries other than your own.

Our servers are located in the United States. If you are accessing our Services from outside, please be aware that your information may be transferred to, stored, and processed by us in our facilities and by those third parties with whom we may share your personal information, in the United States and other countries.

If you are a resident in the European Economic Area (EEA), United Kingdom (UK), or Switzerland, then these countries may not necessarily have data protection laws or other similar laws as comprehensive as those in your country. However, we will take all necessary measures to protect your personal information in accordance with this privacy notice and applicable law.

` : ""}7. HOW LONG DO WE KEEP YOUR INFORMATION?

In Short: We keep your information for as long as necessary to fulfill the purposes outlined in this privacy notice unless otherwise required by law.

We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements). No purpose in this notice will require us keeping your personal information for longer than the period of time in which users have an account with us.

When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize such information, or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible.

8. HOW DO WE KEEP YOUR INFORMATION SAFE?

In Short: We aim to protect your personal information through a system of organizational and technical security measures.

We have implemented appropriate and reasonable technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information. Although we will do our best to protect your personal information, transmission of personal information to and from our Services is at your own risk. You should only access the Services within a secure environment.

9. DO WE COLLECT INFORMATION FROM MINORS?

In Short: We do not knowingly collect data from or market to children under 18 years of age.

We do not knowingly collect, solicit data from, or market to children under 18 years of age, nor do we knowingly sell such personal information. By using the Services, you represent that you are at least 18 or that you are the parent or guardian of such a minor and consent to such minor dependent's use of the Services. If we learn that personal information from users less than 18 years of age has been collected, we will deactivate the account and take reasonable measures to promptly delete such data from our records.

10. WHAT ARE YOUR PRIVACY RIGHTS?

In Short: Depending on your state of residence in the US or in some regions, such as the European Economic Area (EEA), United Kingdom (UK), Switzerland, and Canada, you have rights that allow you greater access to and control over your personal information. You may review, change, or terminate your account at any time, depending on your country, province, or state of residence.

In some regions (like the EEA, UK, Switzerland, and Canada), you have certain rights under applicable data protection laws. These may include the right (i) to request access and obtain a copy of your personal information, (ii) to request rectification or erasure; (iii) to restrict the processing of your personal information; (iv) if applicable, to data portability; and (v) not to be subject to automated decision-making. In certain circumstances, you may also have the right to object to the processing of your personal information.

We will consider and act upon any request in accordance with applicable data protection laws.

Withdrawing your consent

If we are relying on your consent to process your personal information, you have the right to withdraw your consent at any time. You can withdraw your consent at any time by contacting us by using the contact details provided in the section "HOW CAN YOU CONTACT US ABOUT THIS NOTICE?" below.

${s.marketingCommunications ? `Opting out of marketing and promotional communications

You can unsubscribe from our marketing and promotional communications at any time by clicking on the unsubscribe link in the emails that we send, replying "STOP" or "UNSUBSCRIBE" to the SMS messages that we send, or by contacting us using the details provided in the section "HOW CAN YOU CONTACT US ABOUT THIS NOTICE?" below.

` : ""}${s.userAccounts ? `Account Information

If you would at any time like to review or change the information in your account or terminate your account, you can contact us using the contact information provided.

Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, we may retain some information in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our legal terms and/or comply with applicable legal requirements.` : ""}

11. CONTROLS FOR DO-NOT-TRACK FEATURES

Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track ("DNT") feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage, no uniform technology standard for recognizing and implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online.

California law requires us to let you know how we respond to web browser DNT signals. Because there currently is not an industry or legal standard for recognizing or honoring DNT signals, we do not respond to them at this time.

12. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?

In Short: If you are a resident of California, Colorado, Connecticut, Delaware, Florida, Indiana, Iowa, Kentucky, Montana, New Hampshire, New Jersey, Oregon, Tennessee, Texas, Utah, or Virginia, you may have the right to request access to and receive details about the personal information we maintain about you and how we have processed it, correct inaccuracies, get a copy of, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law. More information is provided below.

Categories of Personal Information We Collect

We have collected the following categories of personal information in the past twelve (12) months:

${categoriesSection}

We may also collect other personal information outside of these categories through instances where you interact with us in person, online, or by phone or mail in the context of:

- Receiving help through our customer support channels;
- Participation in customer surveys or contests; and
- Facilitation in the delivery of our Services and to respond to your inquiries.

We will use and retain the collected personal information as needed to provide the Services or for:

${retentionLines}

Sources of Personal Information

Learn more about the sources of personal information we collect in "WHAT INFORMATION DO WE COLLECT?"

How We Use and Share Personal Information

Learn about how we use your personal information in the section, "HOW DO WE PROCESS YOUR INFORMATION?"

Will your information be shared with anyone else?

We may disclose your personal information with our service providers pursuant to a written contract between us and each service provider. Learn more about how we disclose personal information in the section, "WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?"

We may use your personal information for our own business purposes, such as for undertaking internal research for technological development and demonstration. This is not considered to be "selling" of your personal information.

We have not sold or shared any personal information to third parties for a business or commercial purpose in the preceding twelve (12) months.

The categories of third parties to whom we disclosed personal information for a business or commercial purpose can be found under "WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?"

Your Rights

You have rights under certain US state data protection laws. However, these rights are not absolute, and in certain cases, we may decline your request as permitted by law. These rights include:

- Right to know whether or not we are processing your personal data
- Right to access your personal data
- Right to correct inaccuracies in your personal data
- Right to request the deletion of your personal data
- Right to obtain a copy of the personal data you previously shared with us
- Right to non-discrimination for exercising your rights
- Right to opt out of the processing of your personal data if it is used for targeted advertising, the sale of personal data, or profiling in furtherance of decisions that produce legal or similarly significant effects

Depending upon the state where you live, you may also have the following rights:

- Right to obtain a list of the categories of third parties to which we have disclosed personal data
- Right to obtain a list of specific third parties to which we have disclosed personal data
- Right to limit use and disclosure of sensitive personal data
- Right to opt out of the collection of sensitive data and personal data collected through the operation of a voice or facial recognition feature

How to Exercise Your Rights

To exercise these rights, you can contact us by submitting a data subject access request, by referring to the contact details at the bottom of this document.

Request Verification

Upon receiving your request, we will need to verify your identity to determine you are the same person about whom we have the information in our system. We will only use personal information provided in your request to verify your identity or authority to make the request.

Appeals

Under certain US state data protection laws, if we decline to take action regarding your request, you may appeal our decision by emailing us at ${email}. We will inform you in writing of any action taken or not taken in response to the appeal, including a written explanation of the reasons for the decisions. If your appeal is denied, you may submit a complaint to your state attorney general.

California "Shine The Light" Law

California Civil Code Section 1798.83, also known as the "Shine The Light" law, permits our users who are California residents to request and obtain from us, once a year and free of charge, information about categories of personal information (if any) we disclosed to third parties for direct marketing purposes and the names and addresses of all third parties with which we shared personal information in the immediately preceding calendar year. If you are a California resident and would like to make such a request, please submit your request in writing to us by using the contact details provided in the section "HOW CAN YOU CONTACT US ABOUT THIS NOTICE?"

13. DO WE MAKE UPDATES TO THIS NOTICE?

In Short: Yes, we will update this notice as necessary to stay compliant with relevant laws.

We may update this privacy notice from time to time. The updated version will be indicated by an updated "Revised" date at the top of this privacy notice. If we make material changes to this privacy notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this privacy notice frequently to be informed of how we are protecting your information.

14. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?

If you have questions or comments about this notice, you may contact us by post at:

${email}

15. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?

Based on the applicable laws of your country or state of residence in the US, you may have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law. To request to review, update, or delete your personal information, please email us at ${email}.`;
}

// ════════════════════════════════════════════════════════════
// COPY FEEDBACK COMPONENT
// ════════════════════════════════════════════════════════════

function CopyFeedback({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1 text-sm text-green-400 animate-fade-in">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      Copied!
    </span>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════

export default function PrivacyGeneratorPage() {
  const [config, setConfig] = useState<PolicyConfig>({
    companyName: "",
    contactEmail: "",
    includeSms: true,
    sections: {
      googleAnalytics: true,
      cookies: true,
      targetedAdvertising: true,
      marketingCommunications: true,
      internationalTransfer: true,
      userAccounts: true,
      locationData: true,
    },
    categories: INITIAL_CATEGORIES,
  });

  const [copiedRich, setCopiedRich] = useState(false);
  const [copiedPlain, setCopiedPlain] = useState(false);
  const richTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const plainTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateCategory = useCallback(
    (key: string, updates: Partial<DataCategory>) => {
      setConfig((prev) => ({
        ...prev,
        categories: prev.categories.map((cat) =>
          cat.key === key ? { ...cat, ...updates } : cat
        ),
      }));
    },
    []
  );

  const handleCopyRichText = useCallback(async () => {
    const html = generatePolicyHTML(config);
    try {
      const blob = new Blob([html], { type: "text/html" });
      const plainBlob = new Blob([generatePolicyPlainText(config)], {
        type: "text/plain",
      });
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": blob,
          "text/plain": plainBlob,
        }),
      ]);
      setCopiedRich(true);
      if (richTimeoutRef.current) clearTimeout(richTimeoutRef.current);
      richTimeoutRef.current = setTimeout(() => setCopiedRich(false), 2000);
    } catch {
      // Fallback: copy as plain text
      const plain = generatePolicyPlainText(config);
      await navigator.clipboard.writeText(plain);
      setCopiedRich(true);
      if (richTimeoutRef.current) clearTimeout(richTimeoutRef.current);
      richTimeoutRef.current = setTimeout(() => setCopiedRich(false), 2000);
    }
  }, [config]);

  const handleCopyPlainText = useCallback(async () => {
    const plain = generatePolicyPlainText(config);
    try {
      await navigator.clipboard.writeText(plain);
      setCopiedPlain(true);
      if (plainTimeoutRef.current) clearTimeout(plainTimeoutRef.current);
      plainTimeoutRef.current = setTimeout(() => setCopiedPlain(false), 2000);
    } catch {
      // Silent fail
    }
  }, [config]);

  const policyHtml = generatePolicyHTML(config);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 max-w-[1800px] mx-auto">
          <Link
            href="/tools"
            className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="text-sm">Back</span>
          </Link>
          <h1 className="font-serif text-lg font-medium text-text-primary">
            Privacy Policy Generator
          </h1>
          <div className="w-16" />
        </div>
      </header>

      {/* Main Content: Two Columns */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1800px] mx-auto w-full">
        {/* Left: Form Panel */}
        <aside className="w-full lg:w-[420px] lg:min-w-[420px] border-b lg:border-b-0 lg:border-r border-border overflow-y-auto lg:h-[calc(100vh-57px)] lg:sticky lg:top-[57px]">
          <div className="p-5 space-y-6">
            {/* Company Info */}
            <section>
              <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
                Company Information
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="company-name" className="mb-1.5 block">
                    Company Name
                  </Label>
                  <Input
                    id="company-name"
                    placeholder="e.g. Phil The Roofer"
                    value={config.companyName}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        companyName: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="contact-email" className="mb-1.5 block">
                    Contact Email
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="e.g. contact@company.com"
                    value={config.contactEmail}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        contactEmail: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </section>

            {/* SMS Toggle */}
            <section>
              <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
                SMS Data Sharing
              </h2>
              <div className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border">
                <div>
                  <p className="text-sm text-text-primary font-medium">
                    Include SMS Data Sharing Section
                  </p>
                  <p className="text-xs text-text-dim mt-0.5">
                    Adds SMS opt-in data protection clause
                  </p>
                </div>
                <Switch
                  checked={config.includeSms}
                  onCheckedChange={(checked) =>
                    setConfig((prev) => ({
                      ...prev,
                      includeSms: checked,
                    }))
                  }
                  size="sm"
                />
              </div>
            </section>

            {/* Sections & Features */}
            <section>
              <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
                Sections &amp; Features
              </h2>
              <div className="space-y-2">
                {(
                  [
                    {
                      key: "cookies",
                      label: "Cookies & Tracking",
                      desc: "Section 5 — cookie and tracking technology disclosures",
                    },
                    {
                      key: "googleAnalytics",
                      label: "Google Analytics",
                      desc: "Google Analytics disclosure within cookies section",
                    },
                    {
                      key: "targetedAdvertising",
                      label: "Targeted Advertising",
                      desc: "Targeted advertising and personalized content disclosures",
                    },
                    {
                      key: "marketingCommunications",
                      label: "Marketing Emails/SMS",
                      desc: "Marketing and promotional communications opt-out",
                    },
                    {
                      key: "internationalTransfer",
                      label: "International Transfer",
                      desc: "Section 6 — international data transfer disclosures",
                    },
                    {
                      key: "userAccounts",
                      label: "User Accounts",
                      desc: "Account creation, authentication, and management",
                    },
                    {
                      key: "locationData",
                      label: "Location Data",
                      desc: "GPS and device location collection disclosures",
                    },
                  ] as const
                ).map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border"
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm text-text-primary font-medium">
                        {item.label}
                      </p>
                      <p className="text-xs text-text-dim mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                    <Switch
                      checked={
                        config.sections[
                          item.key as keyof SectionToggles
                        ]
                      }
                      onCheckedChange={(checked) =>
                        setConfig((prev) => ({
                          ...prev,
                          sections: {
                            ...prev.sections,
                            [item.key]: checked,
                          },
                        }))
                      }
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Data Categories */}
            <section>
              <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
                Data Categories
              </h2>
              <div className="space-y-3">
                {config.categories.map((cat) => (
                  <div
                    key={cat.key}
                    className={`p-3 rounded-lg border transition-colors ${
                      cat.enabled
                        ? "bg-accent/5 border-accent/30"
                        : "bg-surface border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary">
                          {cat.key}. {cat.label}
                        </p>
                        {cat.description && (
                          <p className="text-xs text-text-dim mt-1 line-clamp-2">
                            {cat.description}
                          </p>
                        )}
                      </div>
                      <Switch
                        checked={cat.enabled}
                        onCheckedChange={(checked) =>
                          updateCategory(cat.key, { enabled: checked })
                        }
                        size="sm"
                      />
                    </div>
                    {cat.enabled && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <Label
                          htmlFor={`retention-${cat.key}`}
                          className="mb-1.5 block text-xs"
                        >
                          Retention Period
                        </Label>
                        <Input
                          id={`retention-${cat.key}`}
                          value={cat.retention}
                          onChange={(e) =>
                            updateCategory(cat.key, {
                              retention: e.target.value,
                            })
                          }
                          className="text-sm !py-2"
                          placeholder="e.g. As long as the user has an account with us"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </aside>

        {/* Right: Preview Panel */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Copy Actions Bar */}
          <div className="sticky top-[57px] z-20 bg-background/80 backdrop-blur-sm border-b border-border px-5 py-3 flex items-center gap-3 flex-wrap">
            <Button
              variant="primary"
              size="sm"
              onClick={handleCopyRichText}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
              Copy as Rich Text
            </Button>
            <CopyFeedback show={copiedRich} />

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyPlainText}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Copy as Plain Text
            </Button>
            <CopyFeedback show={copiedPlain} />

            {(!config.companyName || !config.contactEmail) && (
              <span className="ml-auto text-xs text-text-dim">
                Fill in company name and email to customize
              </span>
            )}
          </div>

          {/* Preview */}
          <div className="flex-1 overflow-y-auto p-5 lg:p-8">
            <div
              className="prose prose-invert max-w-none
                [&_h1]:text-2xl [&_h1]:font-serif [&_h1]:font-bold [&_h1]:text-text-primary [&_h1]:mb-6
                [&_h2]:text-lg [&_h2]:font-serif [&_h2]:font-semibold [&_h2]:text-text-primary [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-border
                [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-text-primary [&_h3]:mt-6 [&_h3]:mb-3
                [&_p]:text-sm [&_p]:text-text-muted [&_p]:leading-relaxed [&_p]:mb-4
                [&_ul]:text-sm [&_ul]:text-text-muted [&_ul]:mb-4 [&_ul]:pl-5 [&_ul]:list-disc
                [&_ol]:text-sm [&_ol]:text-text-muted [&_ol]:mb-4 [&_ol]:pl-5 [&_ol]:list-decimal
                [&_li]:mb-1 [&_li]:leading-relaxed
                [&_strong]:text-text-primary [&_strong]:font-semibold
                [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2
              "
              dangerouslySetInnerHTML={{ __html: policyHtml }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
