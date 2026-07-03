'use client';

import React, { useState } from 'react';
import {
  HelpCircle,
  BookOpen,
  LayoutDashboard,
  Building2,
  BoxesIcon,
  ShoppingCart,
  Truck,
  Package,
  Wallet,
  Settings,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

interface HelpGuideModuleProps {
  language: 'en' | 'bn';
}

interface GuideSection {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  titleEn: string;
  titleBn: string;
  descEn: string;
  descBn: string;
  stepsEn: string[];
  stepsBn: string[];
  tipsEn?: string[];
  tipsBn?: string[];
  color: string;
  bgColor: string;
  borderColor: string;
}

const guideSections: GuideSection[] = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    titleEn: 'Dashboard Overview',
    titleBn: 'ড্যাশবোর্ড পরিদর্শন',
    descEn: 'Your central command center. See today\'s sales, deliveries, stock health, and profit at a single glance. Use quick-action buttons to jump straight into tasks.',
    descBn: 'আপনার কেন্দ্রীয় নিয়ন্ত্রণ কেন্দ্র। আজকের বিক্রয়, ডেলিভারি, স্টকের অবস্থা এবং মুনাফা এক নজরে দেখুন। দ্রুত কাজ শুরু করতে কুইক-অ্যাকশন বাটন ব্যবহার করুন।',
    stepsEn: [
      'View real-time sales revenue, total orders, and pending deliveries in the summary cards.',
      'Check the "Today\'s Revenue" chart to monitor hourly sales trends.',
      'Use the quick action buttons (New Sale, Stock In, Delivery, Expense) to jump to any module instantly.',
      'Download daily PDF reports using the "Download Report" button in the banner.'
    ],
    stepsBn: [
      'সামারি কার্ডে রিয়েল-টাইম বিক্রয় আয়, মোট অর্ডার এবং পেন্ডিং ডেলিভারি দেখুন।',
      'ঘণ্টা ভিত্তিক বিক্রয় প্রবণতা পর্যবেক্ষণ করতে "আজকের রেভিনিউ" চার্ট দেখুন।',
      'যেকোনো মডিউলে তাৎক্ষণিকভাবে যেতে কুইক অ্যাকশন বাটন (নতুন বিক্রয়, স্টক ইন, ডেলিভারি, খরচ) ব্যবহার করুন।',
      'ব্যানারে "রিপোর্ট ডাউনলোড" বাটন ব্যবহার করে দৈনিক পিডিএফ রিপোর্ট ডাউনলোড করুন।'
    ],
    tipsEn: ['The dashboard auto-refreshes with your latest data every time you navigate back to it.'],
    tipsBn: ['প্রতিবার ড্যাশবোর্ডে ফিরে আসলে আপনার সর্বশেষ ডেটা দিয়ে স্বয়ংক্রিয়ভাবে আপডেট হয়।'],
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-100'
  },
  {
    id: 'companies',
    icon: Building2,
    titleEn: 'Companies & Brands',
    titleBn: 'কোম্পানি ও ব্র্যান্ড',
    descEn: 'Register the FMCG companies and brands you distribute (e.g., PRAN, ACI, Olympic). Every product you add later must be linked to a company.',
    descBn: 'আপনি যে এফএমসিজি কোম্পানি এবং ব্র্যান্ড বিতরণ করেন সেগুলো নিবন্ধন করুন (যেমন প্রাণ, এসিআই, অলিম্পিক)। পরে আপনি যে পণ্য যোগ করবেন তা অবশ্যই একটি কোম্পানির সাথে সংযুক্ত থাকতে হবে।',
    stepsEn: [
      'Click "Register Company" to add a new brand.',
      'Enter company name, assign a short code, and optionally add contact info.',
      'Edit or delete companies from the list at any time.',
      'Companies appear as filter options when adding products.'
    ],
    stepsBn: [
      'নতুন ব্র্যান্ড যোগ করতে "কোম্পানি নিবন্ধন" ক্লিক করুন।',
      'কোম্পানির নাম লিখুন, একটি শর্ট কোড দিন এবং ঐচ্ছিকভাবে যোগাযোগের তথ্য যোগ করুন।',
      'যেকোনো সময় তালিকা থেকে কোম্পানি সম্পাদনা বা মুছে ফেলুন।',
      'পণ্য যোগ করার সময় কোম্পানিগুলো ফিল্টার অপশন হিসেবে দেখা যাবে।'
    ],
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-100'
  },
  {
    id: 'products',
    icon: BoxesIcon,
    titleEn: 'Products & Catalog',
    titleBn: 'পণ্য ও ক্যাটালগ',
    descEn: 'Build your full product catalog. Add products with MRP, trade price, variants (pack sizes, flavors), assign categories, and link them to companies.',
    descBn: 'আপনার সম্পূর্ণ পণ্য ক্যাটালগ তৈরি করুন। এমআরপি, ট্রেড প্রাইস, ভ্যারিয়েন্ট (প্যাক সাইজ, ফ্লেভার) সহ পণ্য যোগ করুন, ক্যাটাগরি নির্ধারণ করুন এবং কোম্পানির সাথে সংযুক্ত করুন।',
    stepsEn: [
      'Navigate to Products tab and click "Register Product".',
      'Fill in product name, MRP, trade price, select company, category, and unit.',
      'Use the "Categories" sub-tab to create product groups (e.g., Biscuits, Beverages).',
      'Use "Units" sub-tab to define measurement units (e.g., Piece, Case, Carton).',
      'Products with variants (flavors, pack sizes) can be managed from the Stock module\'s Product Variants section.'
    ],
    stepsBn: [
      'পণ্য ট্যাবে যান এবং "পণ্য নিবন্ধন" ক্লিক করুন।',
      'পণ্যের নাম, এমআরপি, ট্রেড প্রাইস লিখুন, কোম্পানি, ক্যাটাগরি এবং ইউনিট নির্বাচন করুন।',
      'পণ্য গ্রুপ তৈরি করতে "ক্যাটাগরি" সাব-ট্যাব ব্যবহার করুন (যেমন বিস্কুট, পানীয়)।',
      'পরিমাপ একক নির্ধারণ করতে "ইউনিট" সাব-ট্যাব ব্যবহার করুন (যেমন পিস, কেস, কার্টন)।',
      'ভ্যারিয়েন্ট সহ পণ্য (ফ্লেভার, প্যাক সাইজ) স্টক মডিউলের প্রোডাক্ট ভ্যারিয়েন্ট সেকশন থেকে পরিচালনা করা যায়।'
    ],
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-100'
  },
  {
    id: 'purchase',
    icon: Package,
    titleEn: 'Purchase & Stock In',
    titleBn: 'ক্রয় ও স্টক ইন',
    descEn: 'Record goods received from companies into your warehouse (godown). Each purchase creates a stock entry automatically, so your inventory stays accurate.',
    descBn: 'কোম্পানি থেকে আপনার গুদামে (গোডাউন) প্রাপ্ত পণ্য রেকর্ড করুন। প্রতিটি ক্রয় স্বয়ংক্রিয়ভাবে একটি স্টক এন্ট্রি তৈরি করে, তাই আপনার ইনভেন্টরি সঠিক থাকে।',
    stepsEn: [
      'Go to "Purchase & Receive" from the sidebar.',
      'Click "Add New Purchase" — select the product, variant, quantity, and price.',
      'Choose which godown (warehouse) the stock is being received into.',
      'Submit the form — the stock count updates automatically in the Stock module.',
      'View all purchase history in the table below with date, product, and amount details.'
    ],
    stepsBn: [
      'সাইডবার থেকে "ক্রয় ও গ্রহণ" এ যান।',
      '"নতুন ক্রয় যোগ করুন" ক্লিক করুন — পণ্য, ভ্যারিয়েন্ট, পরিমাণ এবং মূল্য নির্বাচন করুন।',
      'কোন গোডাউনে (গুদাম) স্টক গ্রহণ করা হচ্ছে তা নির্বাচন করুন।',
      'ফর্ম জমা দিন — স্টক মডিউলে স্টক গণনা স্বয়ংক্রিয়ভাবে আপডেট হবে।',
      'তারিখ, পণ্য এবং পরিমাণের বিবরণসহ নিচের টেবিলে সমস্ত ক্রয়ের ইতিহাস দেখুন।'
    ],
    tipsEn: ['Always double-check the godown selection before submitting to avoid stock mismatches.'],
    tipsBn: ['স্টক অমিল এড়াতে জমা দেওয়ার আগে সর্বদা গোডাউন নির্বাচন দুবার যাচাই করুন।'],
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-100'
  },
  {
    id: 'sales',
    icon: ShoppingCart,
    titleEn: 'Sales Terminal (POS)',
    titleBn: 'বিক্রয় টার্মিনাল (পিওএস)',
    descEn: 'Create sales orders for your retail shops. Select the SR (salesman), shop, and add products with quantities and any bonus/free items. Generate invoices instantly.',
    descBn: 'আপনার খুচরা দোকানগুলোর জন্য বিক্রয় অর্ডার তৈরি করুন। এসআর (সেলসম্যান), দোকান নির্বাচন করুন এবং পরিমাণ ও যেকোনো বোনাস/ফ্রি আইটেম সহ পণ্য যোগ করুন। তাৎক্ষণিকভাবে ইনভয়েস তৈরি করুন।',
    stepsEn: [
      'Open "Sales Terminal" from the sidebar.',
      'Select the SR (Sales Representative) and the retail shop from the dropdowns.',
      'Search and add products — set quantity and any free/bonus quantity.',
      'Review the order summary showing subtotal and total amount.',
      'Click "Confirm & Place Order" to finalize the sale.',
      'The order will appear in the Delivery module for dispatch.'
    ],
    stepsBn: [
      'সাইডবার থেকে "বিক্রয় টার্মিনাল" খুলুন।',
      'ড্রপডাউন থেকে এসআর (সেলস রিপ্রেজেন্টেটিভ) এবং খুচরা দোকান নির্বাচন করুন।',
      'পণ্য অনুসন্ধান করুন এবং যোগ করুন — পরিমাণ এবং যেকোনো ফ্রি/বোনাস পরিমাণ সেট করুন।',
      'সাবটোটাল এবং মোট পরিমাণ দেখানো অর্ডার সামারি পর্যালোচনা করুন।',
      'বিক্রয় চূড়ান্ত করতে "নিশ্চিত করুন ও অর্ডার দিন" ক্লিক করুন।',
      'অর্ডারটি ডিসপ্যাচের জন্য ডেলিভারি মডিউলে দেখা যাবে।'
    ],
    tipsEn: ['Free/bonus items don\'t count towards the bill total — they are tracked separately for reporting.'],
    tipsBn: ['ফ্রি/বোনাস আইটেম বিলের মোটের মধ্যে গণনা হয় না — এগুলো রিপোর্টিংয়ের জন্য আলাদাভাবে ট্র্যাক করা হয়।'],
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-100'
  },
  {
    id: 'delivery',
    icon: Truck,
    titleEn: 'Delivery Challans',
    titleBn: 'ডেলিভারি চালান',
    descEn: 'Manage outbound deliveries. Assign delivery men, track shipment statuses (Pending → Shipped → Delivered), and filter by SR, shop, or status.',
    descBn: 'বহির্গামী ডেলিভারি পরিচালনা করুন। ডেলিভারি ম্যান নিয়োগ করুন, চালানের স্ট্যাটাস ট্র্যাক করুন (পেন্ডিং → শিপড → ডেলিভারড) এবং এসআর, দোকান বা স্ট্যাটাস অনুযায়ী ফিল্টার করুন।',
    stepsEn: [
      'Go to "Delivery Challans" from the sidebar.',
      'See all pending delivery orders from the Sales module.',
      'Use filters to search by SR, shop name, delivery man, or status.',
      'Assign a delivery man to each order using the dropdown.',
      'Update status: mark as "Shipped" when dispatched, "Delivered" when received by shop.',
      'Download challan PDF for individual deliveries.'
    ],
    stepsBn: [
      'সাইডবার থেকে "ডেলিভারি চালান" এ যান।',
      'বিক্রয় মডিউল থেকে সমস্ত পেন্ডিং ডেলিভারি অর্ডার দেখুন।',
      'এসআর, দোকানের নাম, ডেলিভারি ম্যান বা স্ট্যাটাস অনুযায়ী সার্চ করতে ফিল্টার ব্যবহার করুন।',
      'ড্রপডাউন ব্যবহার করে প্রতিটি অর্ডারে একজন ডেলিভারি ম্যান নিয়োগ করুন।',
      'স্ট্যাটাস আপডেট করুন: ডিসপ্যাচ হলে "শিপড", দোকান কর্তৃক গৃহীত হলে "ডেলিভারড" চিহ্নিত করুন।',
      'প্রতিটি ডেলিভারির জন্য চালান পিডিএফ ডাউনলোড করুন।'
    ],
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-100'
  },
  {
    id: 'stock',
    icon: Package,
    titleEn: 'Stock & Inventory',
    titleBn: 'স্টক ও ইনভেন্টরি',
    descEn: 'View your current warehouse inventory in real-time. Adjust stock levels manually, register product variants (pack sizes, flavors), and track damaged goods.',
    descBn: 'রিয়েল-টাইমে আপনার বর্তমান গুদাম ইনভেন্টরি দেখুন। ম্যানুয়ালি স্টক লেভেল সমন্বয় করুন, প্রোডাক্ট ভ্যারিয়েন্ট (প্যাক সাইজ, ফ্লেভার) নিবন্ধন করুন এবং ক্ষতিগ্রস্ত পণ্য ট্র্যাক করুন।',
    stepsEn: [
      'Navigate to "Stock & Attributes" from the sidebar.',
      'The main table shows all products with current stock quantities per godown.',
      'Use the "+/−" buttons to manually adjust stock (for corrections or physical count).',
      'Switch to "Product Variants" tab to register sizing specs (e.g., Pack: Case of 24, Flavor: Mango).',
      'Variants are used in Purchase and Sales modules for precise tracking.'
    ],
    stepsBn: [
      'সাইডবার থেকে "স্টক ও অ্যাট্রিবিউট" এ যান।',
      'প্রধান টেবিলে প্রতি গোডাউনে বর্তমান স্টক পরিমাণসহ সমস্ত পণ্য দেখায়।',
      'ম্যানুয়ালি স্টক সমন্বয় করতে "+/−" বাটন ব্যবহার করুন (সংশোধন বা ফিজিক্যাল কাউন্টের জন্য)।',
      'সাইজিং স্পেক নিবন্ধন করতে "প্রোডাক্ট ভ্যারিয়েন্ট" ট্যাবে যান (যেমন প্যাক: কেস ২৪টা, ফ্লেভার: আম)।',
      'ভ্যারিয়েন্টগুলো সুনির্দিষ্ট ট্র্যাকিংয়ের জন্য ক্রয় এবং বিক্রয় মডিউলে ব্যবহৃত হয়।'
    ],
    tipsEn: ['Run a physical stock count weekly and use the adjustment feature to reconcile differences.'],
    tipsBn: ['সাপ্তাহিক ফিজিক্যাল স্টক কাউন্ট করুন এবং পার্থক্য মেলাতে অ্যাডজাস্টমেন্ট ফিচার ব্যবহার করুন।'],
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-100'
  },
  {
    id: 'accounts',
    icon: Wallet,
    titleEn: 'Expenses & Accounting',
    titleBn: 'খরচ ও হিসাব-নিকাশ',
    descEn: 'Track all business expenses — SR salaries, fuel costs, warehouse rent, and more. Create expense categories, log transactions with voucher notes, and download reports.',
    descBn: 'সমস্ত ব্যবসায়িক খরচ ট্র্যাক করুন — এসআর বেতন, জ্বালানি খরচ, গুদাম ভাড়া এবং আরও অনেক কিছু। খরচের ক্যাটাগরি তৈরি করুন, ভাউচার নোটসহ লেনদেন রেকর্ড করুন এবং রিপোর্ট ডাউনলোড করুন।',
    stepsEn: [
      'Open "Expenses & Ledgers" from the sidebar.',
      'Add expense categories first (e.g., SR Salaries, Transport Fuel, Warehouse Rent).',
      'Click "Add Expense" to log a new transaction — select category, amount, receiver, and add notes.',
      'View the full expense history in the sortable table.',
      'Track voucher logs for audit and download PDF statements.',
      'Expense types with descriptions help you understand where money is going.'
    ],
    stepsBn: [
      'সাইডবার থেকে "খরচ ও লেজার" খুলুন।',
      'প্রথমে খরচের ক্যাটাগরি যোগ করুন (যেমন এসআর বেতন, পরিবহন জ্বালানি, গুদাম ভাড়া)।',
      'নতুন লেনদেন রেকর্ড করতে "খরচ যোগ করুন" ক্লিক করুন — ক্যাটাগরি, পরিমাণ, প্রাপক নির্বাচন করুন এবং নোট যোগ করুন।',
      'সর্টযোগ্য টেবিলে সম্পূর্ণ খরচের ইতিহাস দেখুন।',
      'অডিটের জন্য ভাউচার লগ ট্র্যাক করুন এবং পিডিএফ স্টেটমেন্ট ডাউনলোড করুন।',
      'বর্ণনাসহ খরচের ধরন আপনাকে বুঝতে সাহায্য করে টাকা কোথায় যাচ্ছে।'
    ],
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-100'
  },
  {
    id: 'settings',
    icon: Settings,
    titleEn: 'Settings & Branding',
    titleBn: 'সেটিংস ও ব্র্যান্ডিং',
    descEn: 'Customize your ERP with your business name, logo, and hub location. Manage warehouse godown locations. Reset the database to demo defaults if needed.',
    descBn: 'আপনার ব্যবসার নাম, লোগো এবং হাব লোকেশন দিয়ে আপনার ইআরপি কাস্টমাইজ করুন। গুদাম গোডাউনের অবস্থান পরিচালনা করুন। প্রয়োজনে ডেটাবেস ডেমো ডিফল্টে রিসেট করুন।',
    stepsEn: [
      'Click "Settings" at the bottom of the sidebar.',
      'In "Hub Branding" tab — update your shop name, sub-heading, and upload your business logo.',
      'Click "Save branding settings" to apply changes — they reflect on the sidebar immediately.',
      'Switch to "Warehouse Godowns" tab to manage storage locations.',
      'Use "Factory Reset" carefully — it erases ALL local data and restores demo defaults.'
    ],
    stepsBn: [
      'সাইডবারের নিচে "সেটিংস" ক্লিক করুন।',
      '"হাব ব্র্যান্ডিং" ট্যাবে — আপনার দোকানের নাম, উপ-শিরোনাম আপডেট করুন এবং আপনার ব্যবসার লোগো আপলোড করুন।',
      'পরিবর্তন প্রয়োগ করতে "ব্র্যান্ডিং সংরক্ষণ করুন" ক্লিক করুন — সাইডবারে তাৎক্ষণিকভাবে প্রতিফলিত হবে।',
      'স্টোরেজ লোকেশন পরিচালনা করতে "গুদাম গোডাউন" ট্যাবে যান।',
      '"ফ্যাক্টরি রিসেট" সাবধানে ব্যবহার করুন — এটি সমস্ত লোকাল ডেটা মুছে ডেমো ডিফল্ট পুনরুদ্ধার করে।'
    ],
    tipsEn: ['Your branding appears on PDF reports and invoices too, so keep it professional.'],
    tipsBn: ['আপনার ব্র্যান্ডিং পিডিএফ রিপোর্ট এবং ইনভয়েসেও দেখা যায়, তাই এটি পেশাদার রাখুন।'],
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-100'
  }
];

export default function HelpGuideModule({ language }: HelpGuideModuleProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('dashboard');

  const toggleSection = (id: string) => {
    setExpandedSection(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 md:p-6 text-slate-800 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-violet-50 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-violet-600" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                {language === 'bn' ? 'ব্যবহারকারী গাইড ও সাহায্য' : 'User Guide & Help Center'}
              </h2>
              <p className="text-slate-500 text-xs font-semibold">
                {language === 'bn' ? 'এই অ্যাপ্লিকেশনটি কীভাবে আপনার ব্যবসা সহজ ও দ্রুত করবে তা বিস্তারিত জানুন' : 'Learn how every feature of this ERP helps you run your distribution business smoothly'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Card */}
      <div className="bg-violet-50 rounded-3xl border border-violet-100 p-5 md:p-6 space-y-3">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-violet-600 mt-0.5 shrink-0" />
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-violet-900">
              {language === 'bn' ? 'বাংলা চেইন ইআরপি কী?' : 'What is Bangla-Chain ERP?'}
            </h3>
            <p className="text-xs text-violet-700 leading-relaxed font-medium">
              {language === 'bn' 
                ? 'বাংলা চেইন ইআরপি হলো একটি সম্পূর্ণ ডিস্ট্রিবিউশন ম্যানেজমেন্ট সিস্টেম যা বাংলাদেশের এফএমসিজি পরিবেশকদের জন্য তৈরি। এটি আপনার পণ্য ক্রয়, স্টক ব্যবস্থাপনা, বিক্রয়, ডেলিভারি এবং হিসাব-নিকাশ — সবকিছু একটি জায়গা থেকে পরিচালনা করতে সাহায্য করে। কোনো ইন্টারনেট সংযোগ ছাড়াই সম্পূর্ণ অফলাইনে কাজ করে।'
                : 'Bangla-Chain ERP is a complete distribution management system built for Bangladeshi FMCG distributors. It helps you manage product procurement, stock management, sales, deliveries, and accounting — all from one place. It works completely offline without any internet connection.'}
            </p>
          </div>
        </div>
      </div>

      {/* Workflow summary */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-800">
          {language === 'bn' ? '📋 ব্যবসার প্রক্রিয়া (ওয়ার্কফ্লো)' : '📋 Business Workflow'}
        </h3>
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          {[
            { en: 'Register Companies', bn: 'কোম্পানি নিবন্ধন', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
            { en: 'Add Products', bn: 'পণ্য যোগ', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
            { en: 'Purchase Stock', bn: 'স্টক ক্রয়', color: 'bg-orange-100 text-orange-800 border-orange-200' },
            { en: 'Create Sales', bn: 'বিক্রয় তৈরি', color: 'bg-pink-100 text-pink-800 border-pink-200' },
            { en: 'Deliver Orders', bn: 'অর্ডার ডেলিভারি', color: 'bg-sky-100 text-sky-800 border-sky-200' },
            { en: 'Track Expenses', bn: 'খরচ ট্র্যাক', color: 'bg-teal-100 text-teal-800 border-teal-200' },
          ].map((step, idx, arr) => (
            <React.Fragment key={step.en}>
              <span className={`px-3 py-1.5 rounded-full border ${step.color}`}>
                {language === 'bn' ? step.bn : step.en}
              </span>
              {idx < arr.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Accordion Guide Sections */}
      <div className="space-y-3">
        {guideSections.map((section) => {
          const Icon = section.icon;
          const isExpanded = expandedSection === section.id;
          
          return (
            <div
              key={section.id}
              className={`bg-white rounded-3xl border shadow-sm overflow-hidden transition-all duration-300 ${
                isExpanded ? `${section.borderColor} border-2` : 'border-slate-200'
              }`}
            >
              {/* Accordion Header */}
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-10 h-10 rounded-xl ${section.bgColor} border ${section.borderColor} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${section.color}`} />
                  </span>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-slate-800">
                      {language === 'bn' ? section.titleBn : section.titleEn}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold line-clamp-1 max-w-lg">
                      {language === 'bn' ? section.descBn.slice(0, 80) + '...' : section.descEn.slice(0, 80) + '...'}
                    </p>
                  </div>
                </div>
                {isExpanded
                  ? <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  : <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                }
              </button>

              {/* Accordion Body */}
              <div 
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isExpanded ? 'max-h-[500px] opacity-100 pb-5 px-5' : 'max-h-0 opacity-0 pb-0 px-5 pointer-events-none'
                }`}
              >
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {language === 'bn' ? section.descBn : section.descEn}
                  </p>

                  {/* Steps */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {language === 'bn' ? 'ধাপে ধাপে নির্দেশনা' : 'Step-by-Step Instructions'}
                    </h4>
                    <ol className="space-y-2">
                      {(language === 'bn' ? section.stepsBn : section.stepsEn).map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className={`w-5 h-5 rounded-full ${section.bgColor} border ${section.borderColor} flex items-center justify-center shrink-0 mt-0.5`}>
                            <span className={`text-[10px] font-bold ${section.color}`}>{idx + 1}</span>
                          </span>
                          <span className="text-xs text-slate-700 leading-relaxed font-medium">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Tips */}
                  {(section.tipsEn || section.tipsBn) && (
                    <div className={`${section.bgColor} rounded-2xl border ${section.borderColor} p-3.5 flex items-start gap-2.5`}>
                      <CheckCircle2 className={`w-4 h-4 ${section.color} mt-0.5 shrink-0`} />
                      <p className="text-[11px] text-slate-700 font-semibold leading-relaxed">
                        <span className="font-bold">{language === 'bn' ? 'টিপস: ' : 'Pro Tip: '}</span>
                        {language === 'bn' ? section.tipsBn?.[0] : section.tipsEn?.[0]}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm text-center space-y-2">
        <p className="text-xs text-slate-500 font-semibold">
          {language === 'bn' 
            ? 'এই গাইডটি আপনার ব্যবসার প্রতিটি পর্যায়ে সাহায্য করার জন্য ডিজাইন করা হয়েছে। কোনো প্রশ্ন বা সমস্যা থাকলে সেটিংস থেকে সাপোর্টে যোগাযোগ করুন।'
            : 'This guide is designed to help you at every stage of your business. If you have questions or issues, reach out via support from Settings.'}
        </p>
        <p className="text-[10px] text-slate-400 font-mono">Bangla-Chain ERP v3.1 • Built for Bangladeshi FMCG Distributors</p>
      </div>
    </div>
  );
}
