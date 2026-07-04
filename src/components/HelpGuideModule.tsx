'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  LayoutDashboard,
  Building2,
  Package,
  MapPin,
  ShoppingCart,
  Truck,
  Wrench,
  BarChart3,
  Settings,
  Wallet,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  AlertTriangle,
  HelpCircle,
  User,
  Lock,
  Star,
  Globe,
  FileText,
  RefreshCw,
  BoxSelect,
  TrendingUp,
} from 'lucide-react';

interface HelpGuideModuleProps {
  language: 'en' | 'bn';
}

interface AccordionSection {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  titleEn: string;
  titleBn: string;
  subtitleEn: string;
  subtitleBn: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  content: {
    descEn: string;
    descBn: string;
    stepsEn: string[];
    stepsBn: string[];
    tipsEn?: string;
    tipsBn?: string;
    warningEn?: string;
    warningBn?: string;
  };
}

const accordionSections: AccordionSection[] = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    titleEn: 'Dashboard',
    titleBn: 'ড্যাশবোর্ড',
    subtitleEn: 'Your real-time business command center',
    subtitleBn: 'আপনার রিয়েল-টাইম ব্যবসায়িক নিয়ন্ত্রণ কেন্দ্র',
    color: 'indigo',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-600',
    content: {
      descEn: "The Dashboard is the first screen you see after login. It gives you a complete snapshot of your business today — sales figures, profit, stock value, expenses, and damages — all without opening any other module.",
      descBn: "ড্যাশবোর্ড হলো লগইনের পর আপনার প্রথম স্ক্রিন। এটি আপনাকে আজকের ব্যবসার সম্পূর্ণ চিত্র দেয় — বিক্রয়, মুনাফা, স্টকের মূল্য, খরচ এবং ক্ষতি — অন্য কোনো মডিউল না খুলেই।",
      stepsEn: [
        "Today's Summary Cards: See today's total sales revenue, total profit, total expenses, and damage stock value at a glance.",
        "Overall KPI Cards: Shows all-time totals — lifetime sales, total purchase cost, net profit, and current inventory value.",
        "Company-wise Stock Chart: Visual bar chart showing stock quantity per company (Pran, Olympic, etc.).",
        "Quick Action Buttons: One-click shortcuts to New Sale, Purchase, Delivery, and Expenses — no need to use the sidebar.",
        "PDF Report Button: Download a full daily summary report as a PDF for record-keeping or sharing.",
        "Data is live — every challan, purchase, or expense you enter immediately updates the dashboard numbers.",
      ],
      stepsBn: [
        "আজকের সামারি কার্ড: আজকের মোট বিক্রয় আয়, মোট মুনাফা, মোট খরচ এবং ক্ষতিগ্রস্ত স্টকের মূল্য এক নজরে দেখুন।",
        "সামগ্রিক কেপিআই কার্ড: সর্বকালের মোট — লাইফটাইম বিক্রয়, মোট ক্রয় মূল্য, নিট মুনাফা এবং বর্তমান ইনভেন্টরি মূল্য।",
        "কোম্পানি-ভিত্তিক স্টক চার্ট: প্রতিটি কোম্পানির স্টকের পরিমাণ দেখানো ভিজুয়াল বার চার্ট (প্রাণ, অলিম্পিক ইত্যাদি)।",
        "কুইক অ্যাকশন বাটন: নতুন বিক্রয়, ক্রয়, ডেলিভারি এবং খরচে এক-ক্লিক শর্টকাট — সাইডবার ব্যবহার করতে হবে না।",
        "পিডিএফ রিপোর্ট বাটন: রেকর্ড রাখা বা শেয়ার করার জন্য একটি সম্পূর্ণ দৈনিক সামারি রিপোর্ট পিডিএফ হিসেবে ডাউনলোড করুন।",
        "ডেটা লাইভ — আপনি যে চালান, ক্রয় বা খরচ এন্ট্রি করেন তা তাৎক্ষণিকভাবে ড্যাশবোর্ডের সংখ্যা আপডেট করে।",
      ],
      tipsEn: "Bookmark or pin the dashboard tab. Check it first thing every morning to know your stock health and yesterday's performance before starting your day.",
      tipsBn: "ড্যাশবোর্ড ট্যাব বুকমার্ক বা পিন করুন। প্রতিদিন সকালে প্রথমে এটি চেক করুন — দিন শুরু করার আগে আপনার স্টকের অবস্থা এবং গতকালের পারফরম্যান্স জানুন।",
    },
  },
  {
    id: 'companies',
    icon: Building2,
    titleEn: 'Companies & Brands',
    titleBn: 'কোম্পানি ও ব্র্যান্ড',
    subtitleEn: 'Register your supplier companies first',
    subtitleBn: 'প্রথমে আপনার সরবরাহকারী কোম্পানি নিবন্ধন করুন',
    color: 'cyan',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    textColor: 'text-cyan-600',
    content: {
      descEn: "Before adding any products, you must register the companies whose goods you distribute — such as Pran, Olympic, Haque, ACI, or Partex. Each product is linked to a company, so this step is mandatory.",
      descBn: "পণ্য যোগ করার আগে, আপনাকে অবশ্যই যে কোম্পানির পণ্য বিতরণ করেন সেগুলো নিবন্ধন করতে হবে — যেমন প্রাণ, অলিম্পিক, হাক্কো, এসিআই বা পার্টেক্স। প্রতিটি পণ্য একটি কোম্পানির সাথে যুক্ত, তাই এই ধাপটি বাধ্যতামূলক।",
      stepsEn: [
        "Go to 'Directory' in the sidebar, then open the 'Companies' tab.",
        "Click 'Add Company' — enter the company name (e.g., PRAN-RFL Group) and a short code (e.g., PRAN).",
        "Optionally add address, contact person, and phone number for reference.",
        "Click Save — the company now appears in all product forms and reports.",
        "To edit a company, click the pencil icon next to its name in the list.",
        "You can delete a company only if no products are linked to it.",
      ],
      stepsBn: [
        "সাইডবারে 'ডিরেক্টরি' যান, তারপর 'কোম্পানি' ট্যাব খুলুন।",
        "'কোম্পানি যোগ করুন' ক্লিক করুন — কোম্পানির নাম (যেমন প্রাণ-আরএফএল গ্রুপ) এবং একটি শর্ট কোড দিন (যেমন PRAN)।",
        "ঐচ্ছিকভাবে রেফারেন্সের জন্য ঠিকানা, যোগাযোগের ব্যক্তি এবং ফোন নম্বর যোগ করুন।",
        "সেভ ক্লিক করুন — কোম্পানিটি এখন সমস্ত পণ্য ফর্ম এবং রিপোর্টে দেখাবে।",
        "কোম্পানি এডিট করতে, তালিকায় তার নামের পাশের পেন্সিল আইকন ক্লিক করুন।",
        "কোনো পণ্য লিঙ্ক না থাকলে কেবলমাত্র কোম্পানি মুছতে পারবেন।",
      ],
      tipsEn: "Use short, recognizable codes (PRAN, OLY, ACI) — they appear on reports and make filtering faster.",
      tipsBn: "ছোট, চেনা কোড ব্যবহার করুন (PRAN, OLY, ACI) — এগুলো রিপোর্টে দেখায় এবং ফিল্টারিং দ্রুত করে।",
    },
  },
  {
    id: 'products',
    icon: Package,
    titleEn: 'Products',
    titleBn: 'পণ্য তালিকা',
    subtitleEn: 'Build your complete product catalog',
    subtitleBn: 'আপনার সম্পূর্ণ পণ্য ক্যাটালগ তৈরি করুন',
    color: 'emerald',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-600',
    content: {
      descEn: "Products are the core of your ERP. Add every SKU you carry — with pricing tiers (DP, TP, MRP), categories, units, warehouse assignment, and opening stock. The product catalog feeds into purchases, sales, and stock tracking.",
      descBn: "পণ্যই আপনার ইআরপির মূল ভিত্তি। আপনার প্রতিটি এসকেইউ যোগ করুন — মূল্য স্তর (ডিপি, টিপি, এমআরপি), ক্যাটাগরি, ইউনিট, গুদাম নির্ধারণ এবং ওপেনিং স্টক সহ। পণ্য ক্যাটালগ ক্রয়, বিক্রয় এবং স্টক ট্র্যাকিংয়ে ব্যবহৃত হয়।",
      stepsEn: [
        "Open 'Directory' → 'Products' tab. Click 'Add Product'.",
        "Enter: Product Name, SKU code (unique ID like PRAN-BC-250), Company, Category, Unit.",
        "Set pricing: DP (Distributor Price), TP (Trade Price / retail cost), MRP (Maximum Retail Price).",
        "Select the Warehouse (Godown) where this product is stored.",
        "Enter Opening Stock quantity — this is your starting inventory count.",
        "Save. The product is now available in Purchase, Sales, and Stock modules.",
        "Categories Tab: Create groups like Biscuit, Juice, Snack, Noodles to organize products.",
        "Units Tab: Define measurement units like Pcs, Carton, Dozen, Pack for accurate tracking.",
      ],
      stepsBn: [
        "'ডিরেক্টরি' → 'পণ্য' ট্যাব খুলুন। 'পণ্য যোগ করুন' ক্লিক করুন।",
        "লিখুন: পণ্যের নাম, এসকেইউ কোড (PRAN-BC-250 এর মতো অনন্য আইডি), কোম্পানি, ক্যাটাগরি, ইউনিট।",
        "মূল্য নির্ধারণ করুন: ডিপি (ডিস্ট্রিবিউটর প্রাইস), টিপি (ট্রেড প্রাইস / খুচরা খরচ), এমআরপি (সর্বোচ্চ খুচরা মূল্য)।",
        "গুদাম (গোডাউন) নির্বাচন করুন যেখানে এই পণ্য সংরক্ষিত।",
        "ওপেনিং স্টকের পরিমাণ লিখুন — এটি আপনার শুরুর ইনভেন্টরি গণনা।",
        "সেভ করুন। পণ্যটি এখন ক্রয়, বিক্রয় এবং স্টক মডিউলে পাওয়া যাবে।",
        "ক্যাটাগরি ট্যাব: বিস্কুট, জুস, স্ন্যাক, নুডলসের মতো গ্রুপ তৈরি করুন।",
        "ইউনিট ট্যাব: সঠিক ট্র্যাকিংয়ের জন্য পিস, কার্টন, ডজন, প্যাকের মতো পরিমাপ একক নির্ধারণ করুন।",
      ],
      tipsEn: "Use a consistent SKU naming pattern like COMPANY-PRODUCT-SIZE (e.g., OLY-CRACKER-90G). It makes searching and filtering much faster when your catalog grows.",
      tipsBn: "COMPANY-PRODUCT-SIZE এর মতো ধারাবাহিক এসকেইউ নামকরণ প্যাটার্ন ব্যবহার করুন (যেমন OLY-CRACKER-90G)। ক্যাটালগ বড় হলে এটি সার্চ ও ফিল্টারিং অনেক দ্রুত করে।",
    },
  },
  {
    id: 'routes',
    icon: MapPin,
    titleEn: 'Delivery Routes & SRs',
    titleBn: 'রুট ও এসআর',
    subtitleEn: 'Manage sales reps and delivery beats',
    subtitleBn: 'সেলস প্রতিনিধি ও ডেলিভারি বিট পরিচালনা করুন',
    color: 'orange',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-600',
    content: {
      descEn: "Add your Sales Representatives (SRs) here and assign them delivery routes (beats). Each SR gets their own login credentials and can only see their own sales data when logged in.",
      descBn: "এখানে আপনার সেলস রিপ্রেজেন্টেটিভ (এসআর) যোগ করুন এবং তাদের ডেলিভারি রুট (বিট) নির্ধারণ করুন। প্রতিটি এসআর তাদের নিজস্ব লগইন ক্রেডেন্শিয়াল পাবে এবং লগইন করলে শুধু তাদের নিজের বিক্রয় ডেটা দেখতে পাবে।",
      stepsEn: [
        "Go to 'Directory' → 'Delivery Routes & SRs' tab.",
        "Click 'Add SR' — enter full name, phone, and set a username + password for their login.",
        "The SR can now log in using those credentials from the main login screen.",
        "Click 'Add Route' to create delivery beats (e.g., Mirpur Beat, Uttara Beat, Dhanmondi Beat).",
        "Assign routes to SRs — one SR can cover multiple routes.",
        "When creating a sale, the SR and route are selected, linking the order to the right person.",
        "SR-wise performance is visible in the Reports module.",
      ],
      stepsBn: [
        "'ডিরেক্টরি' → 'ডেলিভারি রুট ও এসআর' ট্যাবে যান।",
        "'এসআর যোগ করুন' ক্লিক করুন — পুরো নাম, ফোন লিখুন এবং তাদের লগইনের জন্য একটি ইউজারনেম + পাসওয়ার্ড সেট করুন।",
        "এসআর এখন মূল লগইন স্ক্রিন থেকে সেই ক্রেডেন্শিয়াল দিয়ে লগইন করতে পারবে।",
        "'রুট যোগ করুন' ক্লিক করুন ডেলিভারি বিট তৈরি করতে (যেমন মিরপুর বিট, উত্তরা বিট, ধানমন্ডি বিট)।",
        "এসআরদের রুট নির্ধারণ করুন — একজন এসআর একাধিক রুট কভার করতে পারে।",
        "বিক্রয় তৈরি করার সময় এসআর এবং রুট নির্বাচন করা হয়, অর্ডারটি সঠিক ব্যক্তির সাথে সংযুক্ত হয়।",
        "রিপোর্ট মডিউলে এসআর-ভিত্তিক পারফরম্যান্স দেখা যাবে।",
      ],
      tipsEn: "Give each SR a simple, memorable username (e.g., rakib, rahman). Avoid spaces or special characters in usernames.",
      tipsBn: "প্রতিটি এসআরকে একটি সহজ, মনে রাখার মতো ইউজারনেম দিন (যেমন rakib, rahman)। ইউজারনেমে স্পেস বা বিশেষ অক্ষর এড়িয়ে চলুন।",
    },
  },
  {
    id: 'purchase',
    icon: BoxSelect,
    titleEn: 'Receive Stock / Purchase',
    titleBn: 'স্টক রিসিভ / ক্রয়',
    subtitleEn: 'Log every purchase challan from your supplier',
    subtitleBn: 'সরবরাহকারীর প্রতিটি ক্রয় চালান লগ করুন',
    color: 'orange',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-600',
    content: {
      descEn: "Every time you receive goods from a company, log it here as a purchase challan. The system automatically increases your warehouse stock. You can record discount, bonus quantity, and transport costs.",
      descBn: "যতবার আপনি কোনো কোম্পানি থেকে পণ্য পাবেন, এটি এখানে ক্রয় চালান হিসেবে লগ করুন। সিস্টেম স্বয়ংক্রিয়ভাবে আপনার গুদামের স্টক বাড়িয়ে দেবে। আপনি ডিসকাউন্ট, বোনাস পরিমাণ এবং পরিবহন খরচ রেকর্ড করতে পারবেন।",
      stepsEn: [
        "Open 'Procurement' or 'Stock Receive' from the sidebar.",
        "Click 'New Purchase Challan' — select the company and challan/invoice number.",
        "Add products line by line: select product, enter qty, bonus qty (free items), unit price.",
        "Apply discount (%) or flat amount if the company gave a promotional discount.",
        "Enter Carrying/Transport Cost — this adds to the purchase cost for profit calculation.",
        "Select the destination Godown (warehouse) for this stock.",
        "Click 'Save Challan' — stock automatically increases in the Stock module.",
        "View full purchase history below — filter by date, company, or challan number.",
        "Download any challan as PDF using the download icon in the history table.",
      ],
      stepsBn: [
        "সাইডবার থেকে 'প্রকিউরমেন্ট' বা 'স্টক রিসিভ' খুলুন।",
        "'নতুন ক্রয় চালান' ক্লিক করুন — কোম্পানি এবং চালান/ইনভয়েস নম্বর নির্বাচন করুন।",
        "লাইন বাই লাইন পণ্য যোগ করুন: পণ্য নির্বাচন করুন, পরিমাণ, বোনাস পরিমাণ (ফ্রি আইটেম), ইউনিট মূল্য লিখুন।",
        "কোম্পানি প্রমোশনাল ডিসকাউন্ট দিলে ডিসকাউন্ট (%) বা ফ্ল্যাট পরিমাণ প্রযোগ করুন।",
        "ক্যারিং/পরিবহন খরচ লিখুন — এটি মুনাফা গণনার জন্য ক্রয় মূল্যে যোগ হয়।",
        "এই স্টকের জন্য গন্তব্য গোডাউন (গুদাম) নির্বাচন করুন।",
        "'চালান সেভ করুন' ক্লিক করুন — স্টক মডিউলে স্টক স্বয়ংক্রিয়ভাবে বাড়বে।",
        "নিচে সম্পূর্ণ ক্রয় ইতিহাস দেখুন — তারিখ, কোম্পানি বা চালান নম্বর দিয়ে ফিল্টার করুন।",
        "ইতিহাস টেবিলে ডাউনলোড আইকন ব্যবহার করে যেকোনো চালান পিডিএফ হিসেবে ডাউনলোড করুন।",
      ],
      tipsEn: "Always enter the exact challan number from the company's paper invoice. This helps you reconcile your records with the company during monthly statements.",
      tipsBn: "সর্বদা কোম্পানির কাগজের ইনভয়েস থেকে সঠিক চালান নম্বর লিখুন। মাসিক স্টেটমেন্টের সময় কোম্পানির সাথে আপনার রেকর্ড মেলাতে এটি সাহায্য করে।",
    },
  },
  {
    id: 'stock',
    icon: Wrench,
    titleEn: 'Stock Adjustment',
    titleBn: 'স্টক অ্যাডজাস্টমেন্ট',
    subtitleEn: 'Physical count reconciliation and damage tracking',
    subtitleBn: 'ফিজিক্যাল কাউন্ট মিলানো এবং ক্ষতির ট্র্যাকিং',
    color: 'rose',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    textColor: 'text-rose-600',
    content: {
      descEn: "View your live warehouse stock levels per product. When physical stock doesn't match the system, use manual adjustments to fix it. Also manage product variants (pack sizes, flavors) and track damaged goods separately.",
      descBn: "প্রতিটি পণ্যের লাইভ গুদাম স্টক স্তর দেখুন। ফিজিক্যাল স্টক সিস্টেমের সাথে না মিললে, ম্যানুয়াল অ্যাডজাস্টমেন্ট ব্যবহার করে ঠিক করুন। পণ্যের ভ্যারিয়েন্ট (প্যাক সাইজ, ফ্লেভার) পরিচালনা করুন এবং ক্ষতিগ্রস্ত পণ্য আলাদাভাবে ট্র্যাক করুন।",
      stepsEn: [
        "Open 'Stock Adjustment' from the sidebar.",
        "The main table shows all products with their current stock quantity per warehouse.",
        "To adjust: find the product row, click the '+' to add stock or '–' to reduce stock.",
        "Enter the adjustment quantity and optionally add a reason note (e.g., 'Physical count correction').",
        "For damaged goods: mark units as damaged — they are removed from sellable stock and tracked separately.",
        "Product Variants tab: add variants like 'Pack of 12', 'Mango Flavor', 'Small Pack' etc.",
        "Variants appear in purchase and sales forms for more precise order entry.",
        "Filter stock by company or warehouse to find specific items quickly.",
      ],
      stepsBn: [
        "সাইডবার থেকে 'স্টক অ্যাডজাস্টমেন্ট' খুলুন।",
        "প্রধান টেবিলে প্রতিটি গুদামে বর্তমান স্টক পরিমাণসহ সমস্ত পণ্য দেখায়।",
        "অ্যাডজাস্ট করতে: পণ্যের সারি খুঁজুন, স্টক যোগ করতে '+' বা কমাতে '–' ক্লিক করুন।",
        "অ্যাডজাস্টমেন্টের পরিমাণ লিখুন এবং ঐচ্ছিকভাবে একটি কারণ নোট যোগ করুন (যেমন 'ফিজিক্যাল কাউন্ট সংশোধন')।",
        "ক্ষতিগ্রস্ত পণ্যের জন্য: ইউনিটগুলো ক্ষতিগ্রস্ত হিসেবে চিহ্নিত করুন — সেগুলো বিক্রয়যোগ্য স্টক থেকে সরিয়ে আলাদাভাবে ট্র্যাক করা হয়।",
        "প্রোডাক্ট ভ্যারিয়েন্ট ট্যাব: '১২টির প্যাক', 'আমের ফ্লেভার', 'ছোট প্যাক' ইত্যাদি ভ্যারিয়েন্ট যোগ করুন।",
        "আরও সুনির্দিষ্ট অর্ডার এন্ট্রির জন্য ভ্যারিয়েন্ট ক্রয় এবং বিক্রয় ফর্মে দেখায়।",
        "নির্দিষ্ট আইটেম দ্রুত খুঁজতে কোম্পানি বা গুদাম দিয়ে স্টক ফিল্টার করুন।",
      ],
      tipsEn: "Do a physical stock count every Saturday. Compare with the system and adjust immediately. This keeps your reports accurate and prevents surprises at month-end.",
      tipsBn: "প্রতি শনিবার ফিজিক্যাল স্টক কাউন্ট করুন। সিস্টেমের সাথে তুলনা করুন এবং তাৎক্ষণিকভাবে অ্যাডজাস্ট করুন। এটি আপনার রিপোর্ট সঠিক রাখে এবং মাস শেষে বিস্ময় রোধ করে।",
    },
  },
  {
    id: 'sales',
    icon: ShoppingCart,
    titleEn: 'Sales Terminal / POS',
    titleBn: 'বিক্রয় টার্মিনাল / পিওএস',
    subtitleEn: 'Create sales orders and delivery challans',
    subtitleBn: 'বিক্রয় অর্ডার এবং ডেলিভারি চালান তৈরি করুন',
    color: 'pink',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    textColor: 'text-pink-600',
    content: {
      descEn: "The Sales Terminal is your POS (Point of Sale) screen. Use it to create sales orders for your retail clients. Select the SR, route, and delivery man, then add products with quantities and discounts. Completing checkout auto-decreases stock and creates a delivery challan.",
      descBn: "সেলস টার্মিনাল হলো আপনার পিওএস (পয়েন্ট অফ সেল) স্ক্রিন। আপনার খুচরা ক্লায়েন্টদের জন্য বিক্রয় অর্ডার তৈরি করতে এটি ব্যবহার করুন। এসআর, রুট এবং ডেলিভারি ম্যান নির্বাচন করুন, তারপর পরিমাণ ও ডিসকাউন্ট সহ পণ্য যোগ করুন। চেকআউট সম্পন্ন করলে স্টক স্বয়ংক্রিয়ভাবে কমে এবং একটি ডেলিভারি চালান তৈরি হয়।",
      stepsEn: [
        "Open 'Sales Terminal' from the sidebar.",
        "Select SR (Sales Representative) from the dropdown — their assigned routes will load.",
        "Select the Delivery Route/Beat for this order.",
        "Optionally assign a Delivery Man who will physically deliver this order.",
        "Search for products by name or SKU — click to add them to the cart.",
        "For each product: set Quantity and Bonus Qty (free items given with the order).",
        "Apply a line-level or order-level discount if applicable.",
        "Review the order summary: subtotal, total discount, and final payable amount.",
        "Click 'Checkout / Confirm Order' — stock decreases automatically, challan is created.",
        "The completed order appears in Delivery Challans with status 'Pending'.",
      ],
      stepsBn: [
        "সাইডবার থেকে 'সেলস টার্মিনাল' খুলুন।",
        "ড্রপডাউন থেকে এসআর (সেলস রিপ্রেজেন্টেটিভ) নির্বাচন করুন — তাদের নির্ধারিত রুটগুলো লোড হবে।",
        "এই অর্ডারের জন্য ডেলিভারি রুট/বিট নির্বাচন করুন।",
        "ঐচ্ছিকভাবে একজন ডেলিভারি ম্যান নিয়োগ করুন যিনি শারীরিকভাবে এই অর্ডার ডেলিভারি করবেন।",
        "নাম বা এসকেইউ দিয়ে পণ্য অনুসন্ধান করুন — কার্টে যোগ করতে ক্লিক করুন।",
        "প্রতিটি পণ্যের জন্য: পরিমাণ এবং বোনাস পরিমাণ (অর্ডারের সাথে দেওয়া ফ্রি আইটেম) সেট করুন।",
        "প্রযোজ্য হলে লাইন-লেভেল বা অর্ডার-লেভেল ডিসকাউন্ট প্রয়োগ করুন।",
        "অর্ডার সামারি পর্যালোচনা করুন: সাবটোটাল, মোট ডিসকাউন্ট এবং চূড়ান্ত প্রদেয় পরিমাণ।",
        "'চেকআউট / অর্ডার নিশ্চিত করুন' ক্লিক করুন — স্টক স্বয়ংক্রিয়ভাবে কমে, চালান তৈরি হয়।",
        "সম্পন্ন অর্ডার ডেলিভারি চালানে 'পেন্ডিং' স্ট্যাটাস সহ দেখা যাবে।",
      ],
      tipsEn: "If you made a mistake in a sales order, you cannot edit it after checkout. You must create a Stock Adjustment to reverse any wrong stock change, then create a new corrected order.",
      tipsBn: "বিক্রয় অর্ডারে ভুল করলে, চেকআউটের পরে সম্পাদনা করা যাবে না। আপনাকে যেকোনো ভুল স্টক পরিবর্তন উল্টাতে একটি স্টক অ্যাডজাস্টমেন্ট তৈরি করতে হবে, তারপর একটি নতুন সংশোধিত অর্ডার তৈরি করুন।",
    },
  },
  {
    id: 'delivery',
    icon: Truck,
    titleEn: 'Delivery Challans',
    titleBn: 'ডেলিভারি চালান',
    subtitleEn: 'Track and manage all outgoing deliveries',
    subtitleBn: 'সমস্ত বাহ্যিক ডেলিভারি ট্র্যাক ও পরিচালনা করুন',
    color: 'sky',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    textColor: 'text-sky-600',
    content: {
      descEn: "Every sales order becomes a delivery challan. This module lets you manage, assign, and track all outbound shipments. Update status from Pending to Shipped to Delivered as goods move. Download and print individual challans for your delivery men.",
      descBn: "প্রতিটি বিক্রয় অর্ডার একটি ডেলিভারি চালান হয়। এই মডিউল আপনাকে সমস্ত বাহ্যিক শিপমেন্ট পরিচালনা, নিয়োগ এবং ট্র্যাক করতে দেয়। পণ্য চলাচলের সাথে সাথে পেন্ডিং থেকে শিপড থেকে ডেলিভারড স্ট্যাটাস আপডেট করুন।",
      stepsEn: [
        "Open 'Delivery Challans' from the sidebar.",
        "All challans from the Sales Terminal appear here with status 'Pending'.",
        "Use filters to search by SR name, delivery man, date range, or challan status.",
        "To assign a delivery man: click the challan row, select delivery man from dropdown, save.",
        "When goods are dispatched from your godown: change status to 'Shipped'.",
        "When the retailer confirms receipt: change status to 'Delivered'.",
        "You can also create a manual challan (without going through Sales Terminal) using 'New Challan' button.",
        "Click the PDF icon on any challan row to download/print the delivery challan document.",
        "Challan shows: order details, product list, quantities, SR, delivery man, and your shop branding.",
      ],
      stepsBn: [
        "সাইডবার থেকে 'ডেলিভারি চালান' খুলুন।",
        "সেলস টার্মিনাল থেকে সমস্ত চালান এখানে 'পেন্ডিং' স্ট্যাটাস সহ দেখায়।",
        "এসআর নাম, ডেলিভারি ম্যান, তারিখ সীমা বা চালান স্ট্যাটাস দিয়ে সার্চ করতে ফিল্টার ব্যবহার করুন।",
        "ডেলিভারি ম্যান নিয়োগ করতে: চালানের সারি ক্লিক করুন, ড্রপডাউন থেকে ডেলিভারি ম্যান নির্বাচন করুন, সেভ করুন।",
        "আপনার গোডাউন থেকে পণ্য প্রেরণ হলে: স্ট্যাটাস 'শিপড' করুন।",
        "খুচরা বিক্রেতা প্রাপ্তি নিশ্চিত করলে: স্ট্যাটাস 'ডেলিভারড' করুন।",
        "'নতুন চালান' বাটন ব্যবহার করে ম্যানুয়াল চালানও তৈরি করতে পারবেন (সেলস টার্মিনাল ছাড়াই)।",
        "যেকোনো চালান সারিতে পিডিএফ আইকন ক্লিক করে ডেলিভারি চালান ডকুমেন্ট ডাউনলোড/প্রিন্ট করুন।",
        "চালানে দেখায়: অর্ডারের বিবরণ, পণ্যের তালিকা, পরিমাণ, এসআর, ডেলিভারি ম্যান এবং আপনার শপ ব্র্যান্ডিং।",
      ],
      tipsEn: "Print challans and keep them with your delivery men. When they return, collect signed copies. Use these for reconciliation if a retailer disputes a delivery.",
      tipsBn: "চালান প্রিন্ট করুন এবং ডেলিভারি ম্যানদের সাথে দিন। ফিরে আসলে স্বাক্ষরিত কপি সংগ্রহ করুন। কোনো খুচরা বিক্রেতা ডেলিভারি নিয়ে বিতর্ক করলে এগুলো মিলিয়ে নিন।",
    },
  },
  {
    id: 'accounts',
    icon: Wallet,
    titleEn: 'Expenses & Accounts',
    titleBn: 'খরচ ও হিসাব',
    subtitleEn: 'Track all business expenses and calculate profit',
    subtitleBn: 'সকল ব্যবসায়িক খরচ ট্র্যাক করুন এবং মুনাফা গণনা করুন',
    color: 'teal',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    textColor: 'text-teal-600',
    content: {
      descEn: "Log all business expenses — SR salaries, fuel, rent, vehicle repair, office supplies, and anything else. Create categories first, then log daily expenses. Use the Profit Calculator to see your true net profit after deducting all expenses from sales.",
      descBn: "সমস্ত ব্যবসায়িক খরচ লগ করুন — এসআর বেতন, জ্বালানি, ভাড়া, গাড়ি মেরামত, অফিস সরবরাহ এবং অন্য যেকোনো কিছু। প্রথমে ক্যাটাগরি তৈরি করুন, তারপর দৈনিক খরচ লগ করুন। বিক্রয় থেকে সমস্ত খরচ বাদ দিয়ে আপনার প্রকৃত নিট মুনাফা দেখতে প্রফিট ক্যালকুলেটর ব্যবহার করুন।",
      stepsEn: [
        "Open 'Expenses & Accounts' from the sidebar.",
        "First, create Expense Categories: click 'Add Category' — e.g., SR Salary, Vehicle Fuel, Godown Rent, Misc.",
        "To log an expense: click 'Add Expense' — select category, enter amount, date, payee name, and notes.",
        "Save — the expense appears in the ledger table with a voucher number.",
        "Use date filters to view expenses for a specific day, week, or month.",
        "Profit Calculator: select a date range → the system calculates: Sales Revenue – Purchase Cost – Expenses = Net Profit.",
        "Download expense reports as PDF for monthly accounting review.",
        "Voucher numbers are auto-generated for audit trail purposes.",
      ],
      stepsBn: [
        "সাইডবার থেকে 'খরচ ও হিসাব' খুলুন।",
        "প্রথমে খরচের ক্যাটাগরি তৈরি করুন: 'ক্যাটাগরি যোগ করুন' ক্লিক করুন — যেমন এসআর বেতন, গাড়ির জ্বালানি, গোডাউন ভাড়া, বিবিধ।",
        "খরচ লগ করতে: 'খরচ যোগ করুন' ক্লিক করুন — ক্যাটাগরি নির্বাচন করুন, পরিমাণ, তারিখ, প্রদানকারীর নাম এবং নোট লিখুন।",
        "সেভ করুন — খরচটি ভাউচার নম্বর সহ লেজার টেবিলে দেখায়।",
        "নির্দিষ্ট দিন, সপ্তাহ বা মাসের খরচ দেখতে তারিখ ফিল্টার ব্যবহার করুন।",
        "প্রফিট ক্যালকুলেটর: একটি তারিখ সীমা নির্বাচন করুন → সিস্টেম গণনা করে: বিক্রয় আয় – ক্রয় মূল্য – খরচ = নিট মুনাফা।",
        "মাসিক অ্যাকাউন্টিং পর্যালোচনার জন্য খরচের রিপোর্ট পিডিএফ হিসেবে ডাউনলোড করুন।",
        "অডিট ট্রেইলের জন্য ভাউচার নম্বর স্বয়ংক্রিয়ভাবে তৈরি হয়।",
      ],
      tipsEn: "Log expenses every day — even small ones. A ৳50 tea expense adds up to ৳1,500/month. Accurate expense tracking is the only way to know your real profit.",
      tipsBn: "প্রতিদিন খরচ লগ করুন — ছোট খরচও। ৳৫০ চায়ের খরচ মাসে ৳১,৫০০ হয়। সঠিক খরচ ট্র্যাকিংই আপনার প্রকৃত মুনাফা জানার একমাত্র উপায়।",
    },
  },
  {
    id: 'reports',
    icon: BarChart3,
    titleEn: 'Business Reports',
    titleBn: 'ব্যবসায়িক রিপোর্ট',
    subtitleEn: 'Deep-dive into sales, stock, and profit analytics',
    subtitleBn: 'বিক্রয়, স্টক ও মুনাফার গভীর বিশ্লেষণ',
    color: 'violet',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    textColor: 'text-violet-600',
    content: {
      descEn: "The Reports module gives you comprehensive analytics across stock, sales performance, and profitability. Filter by date range, company, or SR to drill down into any dimension of your business. Download any report as PDF.",
      descBn: "রিপোর্ট মডিউল আপনাকে স্টক, বিক্রয় পারফরম্যান্স এবং মুনাফায় ব্যাপক বিশ্লেষণ দেয়। আপনার ব্যবসার যেকোনো মাত্রায় গভীরে যেতে তারিখ সীমা, কোম্পানি বা এসআর দিয়ে ফিল্টার করুন।",
      stepsEn: [
        "Open 'Reports' from the sidebar.",
        "Stock Report: See current stock value per company. Shows qty on hand and total value (qty × DP price).",
        "Sales Report: Company-wise breakdown of sales volume and revenue. See which brands are your top performers.",
        "SR-wise Sales: Compare performance across your Sales Representatives — units sold, revenue, and order count.",
        "Profit Report: For any date range — total sales, purchase cost, expenses, gross profit, and net profit margin %.",
        "Filter all reports by date range using the date pickers at the top.",
        "Click 'Download PDF' to export any report — useful for sharing with your accountant or business partner.",
      ],
      stepsBn: [
        "সাইডবার থেকে 'রিপোর্ট' খুলুন।",
        "স্টক রিপোর্ট: প্রতিটি কোম্পানির বর্তমান স্টক মূল্য দেখুন। হাতে পরিমাণ এবং মোট মূল্য (পরিমাণ × ডিপি মূল্য) দেখায়।",
        "বিক্রয় রিপোর্ট: বিক্রয়ের পরিমাণ এবং আয়ের কোম্পানি-ভিত্তিক বিভাজন। কোন ব্র্যান্ড আপনার শীর্ষ পারফর্মার তা দেখুন।",
        "এসআর-ভিত্তিক বিক্রয়: আপনার সেলস রিপ্রেজেন্টেটিভদের পারফরম্যান্স তুলনা করুন — বিক্রিত ইউনিট, আয় এবং অর্ডার সংখ্যা।",
        "প্রফিট রিপোর্ট: যেকোনো তারিখ সীমার জন্য — মোট বিক্রয়, ক্রয় মূল্য, খরচ, গ্রস মুনাফা এবং নিট মুনাফা মার্জিন %।",
        "উপরের ডেট পিকার ব্যবহার করে তারিখ সীমা দিয়ে সমস্ত রিপোর্ট ফিল্টার করুন।",
        "যেকোনো রিপোর্ট রপ্তানি করতে 'পিডিএফ ডাউনলোড করুন' ক্লিক করুন — আপনার অ্যাকাউন্ট্যান্ট বা ব্যবসায়িক অংশীদারের সাথে শেয়ার করার জন্য উপকারী।",
      ],
      tipsEn: "Run the Profit Report weekly. If gross profit is healthy but net profit is low, look at your Expenses report — overhead costs may be eating your margins.",
      tipsBn: "সাপ্তাহিক প্রফিট রিপোর্ট চালান। গ্রস মুনাফা ভালো কিন্তু নিট মুনাফা কম হলে, আপনার খরচের রিপোর্ট দেখুন — ওভারহেড খরচ আপনার মার্জিন খেয়ে ফেলছে হয়তো।",
    },
  },
  {
    id: 'settings',
    icon: Settings,
    titleEn: 'Settings',
    titleBn: 'সেটিংস',
    subtitleEn: 'Branding, accounts, warehouses, and system control',
    subtitleBn: 'ব্র্যান্ডিং, অ্যাকাউন্ট, গুদাম এবং সিস্টেম নিয়ন্ত্রণ',
    color: 'slate',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    textColor: 'text-slate-600',
    content: {
      descEn: "Settings lets you customize the entire ERP to your business. Change your shop name, upload your logo, manage warehouse godowns, control user accounts (SRs), change passwords, and perform a factory reset if needed.",
      descBn: "সেটিংস আপনাকে সম্পূর্ণ ইআরপি আপনার ব্যবসা অনুযায়ী কাস্টমাইজ করতে দেয়। আপনার দোকানের নাম পরিবর্তন করুন, লোগো আপলোড করুন, গুদাম গোডাউন পরিচালনা করুন, ব্যবহারকারী অ্যাকাউন্ট (এসআর) নিয়ন্ত্রণ করুন, পাসওয়ার্ড পরিবর্তন করুন এবং প্রয়োজনে ফ্যাক্টরি রিসেট করুন।",
      stepsEn: [
        "Click 'Settings' at the bottom of the sidebar.",
        "Branding Tab: Enter your shop name, sub-brand/tagline, and upload your business logo (PNG/JPG).",
        "Click 'Save Branding' — your logo and name instantly appear on the sidebar, PDF reports, and challans.",
        "User Accounts Tab: See all SR accounts. Add new SR with username and password. Edit or delete existing ones.",
        "Admin Password: Change the admin login password from here. Keep it secure.",
        "Warehouses/Godowns Tab: Add or edit warehouse locations. These appear in product, purchase, and stock forms.",
        "Factory Reset: This deletes ALL data — products, sales, stock, expenses, users — and restores demo data.",
      ],
      stepsBn: [
        "সাইডবারের নিচে 'সেটিংস' ক্লিক করুন।",
        "ব্র্যান্ডিং ট্যাব: আপনার দোকানের নাম, সাব-ব্র্যান্ড/ট্যাগলাইন লিখুন এবং আপনার ব্যবসার লোগো আপলোড করুন (PNG/JPG)।",
        "'ব্র্যান্ডিং সেভ করুন' ক্লিক করুন — আপনার লোগো এবং নাম তাৎক্ষণিকভাবে সাইডবার, পিডিএফ রিপোর্ট এবং চালানে দেখায়।",
        "ব্যবহারকারী অ্যাকাউন্ট ট্যাব: সমস্ত এসআর অ্যাকাউন্ট দেখুন। ইউজারনেম ও পাসওয়ার্ড সহ নতুন এসআর যোগ করুন। বিদ্যমান অ্যাকাউন্ট সম্পাদনা বা মুছুন।",
        "অ্যাডমিন পাসওয়ার্ড: এখান থেকে অ্যাডমিন লগইন পাসওয়ার্ড পরিবর্তন করুন। এটি সুরক্ষিত রাখুন।",
        "গুদাম/গোডাউন ট্যাব: গুদামের অবস্থান যোগ বা সম্পাদনা করুন। এগুলো পণ্য, ক্রয় এবং স্টক ফর্মে দেখায়।",
        "ফ্যাক্টরি রিসেট: এটি সমস্ত ডেটা মুছে দেয় — পণ্য, বিক্রয়, স্টক, খরচ, ব্যবহারকারী — এবং ডেমো ডেটা পুনরুদ্ধার করে।",
      ],
      tipsEn: "Update your branding settings on Day 1 before entering any real data. Your logo appears on every PDF you'll ever print from this system.",
      tipsBn: "যেকোনো আসল ডেটা প্রবেশ করানোর আগে ১ম দিনেই আপনার ব্র্যান্ডিং সেটিংস আপডেট করুন। এই সিস্টেম থেকে প্রিন্ট করা প্রতিটি পিডিএফে আপনার লোগো দেখাবে।",
      warningEn: "Factory Reset is IRREVERSIBLE. It will permanently delete all your data. Only use it to start fresh or during initial setup. Back up important data manually before proceeding.",
      warningBn: "ফ্যাক্টরি রিসেট অপরিবর্তনযোগ্য। এটি আপনার সমস্ত ডেটা স্থায়ীভাবে মুছে দেবে। শুধুমাত্র নতুন করে শুরু করতে বা প্রাথমিক সেটআপের সময় ব্যবহার করুন।",
    },
  },
];

const faqs = [
  {
    qEn: 'Will my data be lost if I close the browser or refresh?',
    qBn: 'ব্রাউজার বন্ধ করলে বা রিফ্রেশ দিলে কি ডেটা হারিয়ে যাবে?',
    aEn: 'No. All data is saved in your browser\'s localStorage automatically. It persists across refreshes, tab closes, and even restarts — as long as you don\'t clear your browser data or use Incognito/Private mode.',
    aBn: 'না। সমস্ত ডেটা স্বয়ংক্রিয়ভাবে আপনার ব্রাউজারের লোকালস্টোরেজে সংরক্ষিত হয়। রিফ্রেশ, ট্যাব বন্ধ এবং পুনরায় চালু করার পরেও এটি থাকে — যতক্ষণ আপনি ব্রাউজার ডেটা পরিষ্কার না করেন বা ইনকগনিটো/প্রাইভেট মোড ব্যবহার না করেন।',
  },
  {
    qEn: 'How do I add a new SR (Sales Representative)?',
    qBn: 'নতুন এসআর (সেলস রিপ্রেজেন্টেটিভ) কীভাবে যোগ করব?',
    aEn: 'Go to Settings → User Accounts tab → click "Add SR". Enter the SR\'s full name, phone number, username, and password. They can then log in using those credentials on the main login screen.',
    aBn: 'সেটিংস → ব্যবহারকারী অ্যাকাউন্ট ট্যাবে যান → "এসআর যোগ করুন" ক্লিক করুন। এসআরের পুরো নাম, ফোন নম্বর, ইউজারনেম এবং পাসওয়ার্ড লিখুন। তারপর তারা মূল লগইন স্ক্রিনে সেই ক্রেডেন্শিয়াল দিয়ে লগইন করতে পারবে।',
  },
  {
    qEn: 'Stock didn\'t decrease after I made a sale. What happened?',
    qBn: 'বিক্রয় করার পরে স্টক কমেনি। কী হয়েছে?',
    aEn: 'Stock only decreases when you complete the checkout step. If you added products to the cart but did not click "Checkout / Confirm Order", the sale was not finalized. Go back to Sales Terminal and complete the order.',
    aBn: 'স্টক শুধুমাত্র চেকআউট ধাপ সম্পন্ন করলেই কমে। যদি আপনি কার্টে পণ্য যোগ করেন কিন্তু "চেকআউট / অর্ডার নিশ্চিত করুন" ক্লিক না করেন, তাহলে বিক্রয় চূড়ান্ত হয়নি। সেলস টার্মিনালে ফিরে অর্ডার সম্পন্ন করুন।',
  },
  {
    qEn: 'How do I change the shop name and logo?',
    qBn: 'দোকানের নাম এবং লোগো কীভাবে পরিবর্তন করব?',
    aEn: 'Go to Settings → Branding tab. Update the shop name and sub-brand text, then upload your logo image (PNG or JPG). Click "Save Branding Settings". Changes appear immediately on the sidebar and on all printed PDFs.',
    aBn: 'সেটিংস → ব্র্যান্ডিং ট্যাবে যান। দোকানের নাম ও সাব-ব্র্যান্ড টেক্সট আপডেট করুন, তারপর আপনার লোগো ছবি (PNG বা JPG) আপলোড করুন। "ব্র্যান্ডিং সেটিংস সেভ করুন" ক্লিক করুন। পরিবর্তন সাথে সাথে সাইডবার ও সব প্রিন্টেড পিডিএফে দেখায়।',
  },
  {
    qEn: 'Can multiple users (admin + SRs) use the system at the same time?',
    qBn: 'একাধিক ব্যবহারকারী (অ্যাডমিন + এসআর) কি একসাথে সিস্টেম ব্যবহার করতে পারবে?',
    aEn: 'Yes, but on separate devices/browsers. Each user logs in with their own credentials. Admin sees all data; SRs see only their own sales. Note: since data is in localStorage, each device has its own database — data does not sync between devices automatically.',
    aBn: 'হ্যাঁ, কিন্তু আলাদা ডিভাইস/ব্রাউজারে। প্রতিটি ব্যবহারকারী তাদের নিজস্ব ক্রেডেন্শিয়াল দিয়ে লগইন করে। অ্যাডমিন সব ডেটা দেখে; এসআররা শুধু তাদের নিজের বিক্রয় দেখে। নোট: ডেটা লোকালস্টোরেজে থাকায়, প্রতিটি ডিভাইসের নিজস্ব ডেটাবেস আছে — ডেটা স্বয়ংক্রিয়ভাবে ডিভাইসে সিঙ্ক হয় না।',
  },
  {
    qEn: 'How do I reset everything and start fresh?',
    qBn: 'সব রিসেট করে নতুন করে কীভাবে শুরু করব?',
    aEn: 'Go to Settings → scroll to the bottom → click "Factory Reset". WARNING: This permanently deletes ALL data including products, sales, stock, expenses, and user accounts. The system will reload with demo data. This cannot be undone.',
    aBn: 'সেটিংস → নিচে স্ক্রল করুন → "ফ্যাক্টরি রিসেট" ক্লিক করুন। সতর্কতা: এটি পণ্য, বিক্রয়, স্টক, খরচ এবং ব্যবহারকারী অ্যাকাউন্টসহ সমস্ত ডেটা স্থায়ীভাবে মুছে দেয়। সিস্টেম ডেমো ডেটা দিয়ে পুনরায় লোড হবে। এটি পূর্বাবস্থায় ফেরানো যাবে না।',
  },
  {
    qEn: 'How do I download a PDF report?',
    qBn: 'পিডিএফ রিপোর্ট কীভাবে ডাউনলোড করব?',
    aEn: 'Almost every module has a PDF download button. In the Dashboard, use the "Download Report" button. In Delivery Challans, click the PDF icon on any challan row. In Reports module, click "Download PDF" at the top. In Expenses, use the download button in the ledger view.',
    aBn: 'প্রায় প্রতিটি মডিউলে একটি পিডিএফ ডাউনলোড বাটন আছে। ড্যাশবোর্ডে "রিপোর্ট ডাউনলোড করুন" বাটন ব্যবহার করুন। ডেলিভারি চালানে যেকোনো চালান সারিতে পিডিএফ আইকন ক্লিক করুন। রিপোর্ট মডিউলে উপরে "পিডিএফ ডাউনলোড করুন" ক্লিক করুন। খরচে লেজার ভিউতে ডাউনলোড বাটন ব্যবহার করুন।',
  },
  {
    qEn: 'How do I switch the language between English and Bengali?',
    qBn: 'ইংরেজি এবং বাংলার মধ্যে ভাষা কীভাবে পরিবর্তন করব?',
    aEn: 'Look for the language switcher at the top-right of the screen (shows EN / BN). Click it to toggle between English and Bengali. Your preference is saved and persists across sessions.',
    aBn: 'স্ক্রিনের উপরে-ডানে ভাষা সুইচার খুঁজুন (EN / BN দেখায়)। ইংরেজি এবং বাংলার মধ্যে টগল করতে ক্লিক করুন। আপনার পছন্দ সংরক্ষিত হয় এবং সেশন জুড়ে থাকে।',
  },
];

const colorMap: Record<string, { bg: string; border: string; text: string; badge: string; step: string }> = {
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600', badge: 'bg-indigo-100 text-indigo-700', step: 'bg-indigo-100 border-indigo-200 text-indigo-700' },
  cyan:   { bg: 'bg-cyan-50',   border: 'border-cyan-200',   text: 'text-cyan-600',   badge: 'bg-cyan-100 text-cyan-700',   step: 'bg-cyan-100 border-cyan-200 text-cyan-700'   },
  emerald:{ bg: 'bg-emerald-50',border: 'border-emerald-200',text: 'text-emerald-600',badge: 'bg-emerald-100 text-emerald-700',step:'bg-emerald-100 border-emerald-200 text-emerald-700'},
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700', step: 'bg-orange-100 border-orange-200 text-orange-700' },
  rose:   { bg: 'bg-rose-50',   border: 'border-rose-200',   text: 'text-rose-600',   badge: 'bg-rose-100 text-rose-700',   step: 'bg-rose-100 border-rose-200 text-rose-700'   },
  pink:   { bg: 'bg-pink-50',   border: 'border-pink-200',   text: 'text-pink-600',   badge: 'bg-pink-100 text-pink-700',   step: 'bg-pink-100 border-pink-200 text-pink-700'   },
  sky:    { bg: 'bg-sky-50',    border: 'border-sky-200',    text: 'text-sky-600',    badge: 'bg-sky-100 text-sky-700',    step: 'bg-sky-100 border-sky-200 text-sky-700'    },
  teal:   { bg: 'bg-teal-50',   border: 'border-teal-200',   text: 'text-teal-600',   badge: 'bg-teal-100 text-teal-700',   step: 'bg-teal-100 border-teal-200 text-teal-700'   },
  violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-600', badge: 'bg-violet-100 text-violet-700', step: 'bg-violet-100 border-violet-200 text-violet-700'},
  slate:  { bg: 'bg-slate-50',  border: 'border-slate-200',  text: 'text-slate-600',  badge: 'bg-slate-100 text-slate-700',  step: 'bg-slate-100 border-slate-200 text-slate-700'  },
};

export default function HelpGuideModule({ language }: HelpGuideModuleProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['dashboard']));
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());

  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleFaq = (idx: number) => {
    setOpenFaqs(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const t = (en: string, bn: string) => language === 'bn' ? bn : en;

  return (
    <div className="space-y-6 pb-8">

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/30 via-transparent to-indigo-900/30 pointer-events-none" />
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                {t('Help Guide & User Manual', 'সাহায্য গাইড ও ব্যবহারকারী ম্যানুয়াল')}
              </h1>
              <span className="px-2.5 py-1 rounded-full bg-violet-500/30 border border-violet-400/30 text-violet-200 text-[11px] font-bold tracking-wider">
                v3.1
              </span>
            </div>
            <p className="text-slate-400 text-sm font-medium mt-1">
              {t(
                'Complete reference guide for Bangla-Chain ERP — read this and you\'ll know everything.',
                'বাংলা-চেইন ইআরপির সম্পূর্ণ রেফারেন্স গাইড — এটি পড়লে সব জানতে পারবেন।'
              )}
            </p>
          </div>
        </div>
        <div className="relative z-10 mt-5 flex flex-wrap gap-2">
          {['Dashboard', 'Companies', 'Products', 'Purchase', 'Sales', 'Delivery', 'Reports', 'Settings'].map(m => (
            <span key={m} className="px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-white/60 text-[10px] font-semibold tracking-wide">
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* ── QUICK START ── */}
      <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-3xl p-5 md:p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center">
            <Star className="w-4 h-4 text-violet-600" />
          </div>
          <h2 className="text-base font-black text-violet-900">
            {t('Quick Start — 6-Step Workflow', 'দ্রুত শুরু — ৬-ধাপের ওয়ার্কফ্লো')}
          </h2>
        </div>
        <p className="text-xs text-violet-700 font-medium mb-4">
          {t(
            'Follow these steps in order when setting up for the first time. Do not skip steps — each one depends on the previous.',
            'প্রথমবার সেটআপ করার সময় এই ধাপগুলো ক্রমানুসারে অনুসরণ করুন। ধাপ এড়িয়ে যাবেন না — প্রতিটি আগেরটির উপর নির্ভরশীল।'
          )}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { num: '1', labelEn: 'Register Companies', labelBn: 'কোম্পানি নিবন্ধন', icon: Building2, color: 'bg-cyan-100 border-cyan-200 text-cyan-700' },
            { num: '2', labelEn: 'Add Products', labelBn: 'পণ্য যোগ করুন', icon: Package, color: 'bg-emerald-100 border-emerald-200 text-emerald-700' },
            { num: '3', labelEn: 'Receive Purchase', labelBn: 'ক্রয় গ্রহণ', icon: BoxSelect, color: 'bg-amber-100 border-amber-200 text-amber-700' },
            { num: '4', labelEn: 'Create Sales', labelBn: 'বিক্রয় তৈরি', icon: ShoppingCart, color: 'bg-pink-100 border-pink-200 text-pink-700' },
            { num: '5', labelEn: 'Deliver Orders', labelBn: 'অর্ডার ডেলিভারি', icon: Truck, color: 'bg-sky-100 border-sky-200 text-sky-700' },
            { num: '6', labelEn: 'Log Expenses', labelBn: 'খরচ লগ করুন', icon: Wallet, color: 'bg-teal-100 border-teal-200 text-teal-700' },
          ].map((step, i, arr) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="relative flex flex-col items-center text-center">
                <div className={`w-full rounded-2xl border p-3 flex flex-col items-center gap-1.5 ${step.color}`}>
                  <span className="text-[10px] font-black opacity-60">STEP {step.num}</span>
                  <Icon className="w-5 h-5" />
                  <span className="text-[11px] font-bold leading-tight">
                    {t(step.labelEn, step.labelBn)}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 z-10" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── LOGIN CREDENTIALS ── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
            <Lock className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">
              {t('Default Login Credentials', 'ডিফল্ট লগইন ক্রেডেন্শিয়াল')}
            </h2>
            <p className="text-[11px] text-slate-500 font-semibold">
              {t('Use these to log in. Admin can change passwords in Settings.', 'লগইনের জন্য এগুলো ব্যবহার করুন। অ্যাডমিন সেটিংসে পাসওয়ার্ড পরিবর্তন করতে পারে।')}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('Role', 'ভূমিকা')}</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('Name', 'নাম')}</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('Username', 'ইউজারনেম')}</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('Password', 'পাসওয়ার্ড')}</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('Access', 'অ্যাক্সেস')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                { role: t('Admin','অ্যাডমিন'), name: t('Administrator','অ্যাডমিনিস্ট্রেটর'), user: 'admin', pass: 'admin', access: t('Full access — all modules','সম্পূর্ণ অ্যাক্সেস — সব মডিউল'), badge: 'bg-violet-100 text-violet-700' },
                { role: t('SR','এসআর'), name: 'SR Rakib', user: 'rakib', pass: 'rakib123', access: t('Own sales only','শুধু নিজের বিক্রয়'), badge: 'bg-blue-100 text-blue-700' },
                { role: t('SR','এসআর'), name: 'SR Rahman', user: 'rahman', pass: 'rahman123', access: t('Own sales only','শুধু নিজের বিক্রয়'), badge: 'bg-blue-100 text-blue-700' },
                { role: t('SR','এসআর'), name: 'SR Rahim', user: 'rahim', pass: 'rahim123', access: t('Own sales only','শুধু নিজের বিক্রয়'), badge: 'bg-blue-100 text-blue-700' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${row.badge}`}>{row.role}</span>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-800">{row.name}</td>
                  <td className="px-4 py-3"><code className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-xs font-mono font-bold">{row.user}</code></td>
                  <td className="px-4 py-3"><code className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-xs font-mono font-bold">{row.pass}</code></td>
                  <td className="px-4 py-3 text-[11px] text-slate-500 font-medium">{row.access}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800 font-semibold">
            {t(
              'Change the admin password immediately after your first login. Admin can create new SR accounts from Settings → User Accounts.',
              'প্রথম লগইনের পরেই অ্যাডমিন পাসওয়ার্ড পরিবর্তন করুন। অ্যাডমিন সেটিংস → ব্যবহারকারী অ্যাকাউন্ট থেকে নতুন এসআর অ্যাকাউন্ট তৈরি করতে পারে।'
            )}
          </p>
        </div>
      </div>

      {/* ── MODULE GUIDE SECTIONS (Accordion) ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">
            {t('Module-by-Module Guide', 'মডিউল-ভিত্তিক গাইড')}
          </h2>
        </div>
        <div className="space-y-2.5">
          {accordionSections.map((section) => {
            const Icon = section.icon;
            const isOpen = openSections.has(section.id);
            const c = colorMap[section.color] ?? colorMap.slate;
            const steps = t('x', 'x') === 'x'
              ? section.content.stepsBn
              : section.content.stepsEn;
            const actualSteps = language === 'bn' ? section.content.stepsBn : section.content.stepsEn;

            return (
              <div
                key={section.id}
                className={`bg-white rounded-3xl border shadow-sm overflow-hidden transition-all duration-200 ${
                  isOpen ? `${c.border} border-2` : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-4 md:p-5 text-left hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${c.text}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-black text-slate-900">
                          {t(section.titleEn, section.titleBn)}
                        </h3>
                        <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${c.badge}`}>
                          {t(section.subtitleEn, section.subtitleBn)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium sm:hidden mt-0.5">
                        {t(section.subtitleEn, section.subtitleBn)}
                      </p>
                    </div>
                  </div>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ml-3 transition-colors ${isOpen ? c.bg : 'bg-slate-100'}`}>
                    {isOpen
                      ? <ChevronDown className={`w-4 h-4 ${c.text}`} />
                      : <ChevronRight className="w-4 h-4 text-slate-400" />
                    }
                  </div>
                </button>

                {/* Body */}
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[1200px]' : 'max-h-0'}`}>
                  <div className="px-4 md:px-5 pb-5 space-y-4 border-t border-slate-100 pt-4">

                    {/* Description */}
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {language === 'bn' ? section.content.descBn : section.content.descEn}
                    </p>

                    {/* Steps */}
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                        {t('Step-by-Step Instructions', 'ধাপে ধাপে নির্দেশনা')}
                      </h4>
                      <ol className="space-y-2">
                        {actualSteps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${c.step}`}>
                              <span className="text-[9px] font-black">{idx + 1}</span>
                            </span>
                            <span className="text-xs text-slate-700 leading-relaxed font-medium">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Tip */}
                    {(section.content.tipsEn || section.content.tipsBn) && (
                      <div className={`${c.bg} border ${c.border} rounded-2xl p-3.5 flex items-start gap-2.5`}>
                        <CheckCircle2 className={`w-4 h-4 ${c.text} mt-0.5 shrink-0`} />
                        <p className="text-[11px] text-slate-700 font-semibold leading-relaxed">
                          <span className="font-black">{t('Tip: ', 'টিপস: ')}</span>
                          {language === 'bn' ? section.content.tipsBn : section.content.tipsEn}
                        </p>
                      </div>
                    )}

                    {/* Warning */}
                    {(section.content.warningEn || section.content.warningBn) && (
                      <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-red-700 font-semibold leading-relaxed">
                          <span className="font-black">{t('Warning: ', 'সতর্কতা: ')}</span>
                          {language === 'bn' ? section.content.warningBn : section.content.warningEn}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── FAQ SECTION ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">
            {t('Frequently Asked Questions', 'সাধারণ জিজ্ঞাসা')}
          </h2>
        </div>
        <div className="space-y-2">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqs.has(idx);
            return (
              <div
                key={idx}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 ${
                  isOpen ? 'border-violet-200 border-2' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50/50 transition-colors gap-3"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center shrink-0 mt-0.5">
                      <HelpCircle className="w-3 h-3 text-violet-600" />
                    </span>
                    <span className="text-xs font-bold text-slate-800 leading-relaxed">
                      {language === 'bn' ? faq.qBn : faq.qEn}
                    </span>
                  </div>
                  {isOpen
                    ? <ChevronDown className="w-4 h-4 text-violet-400 shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  }
                </button>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                  <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {language === 'bn' ? faq.aBn : faq.aEn}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── DATA STORAGE NOTE ── */}
      <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-sm font-black text-blue-900 mb-1">
            {t('How Data is Stored', 'ডেটা কীভাবে সংরক্ষিত হয়')}
          </h3>
          <p className="text-xs text-blue-700 font-medium leading-relaxed">
            {t(
              'All your data — products, sales, stock, expenses — is saved in your browser\'s localStorage. This means: (1) No internet required. (2) Data is on this device only. (3) Clearing browser data or using Incognito mode will lose your data. (4) To back up, use the export features in the Reports module.',
              'আপনার সমস্ত ডেটা — পণ্য, বিক্রয়, স্টক, খরচ — আপনার ব্রাউজারের লোকালস্টোরেজে সংরক্ষিত হয়। এর অর্থ: (১) কোনো ইন্টারনেট প্রয়োজন নেই। (২) ডেটা শুধুমাত্র এই ডিভাইসে। (৩) ব্রাউজার ডেটা পরিষ্কার করলে বা ইনকগনিটো মোড ব্যবহার করলে ডেটা হারিয়ে যাবে। (৪) ব্যাকআপের জন্য রিপোর্ট মডিউলের এক্সপোর্ট ফিচার ব্যবহার করুন।'
            )}
          </p>
        </div>
      </div>

      {/* ── QUICK REFERENCE ── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">
            {t('Quick Module Reference', 'দ্রুত মডিউল রেফারেন্স')}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { icon: LayoutDashboard, labelEn: 'Dashboard', labelBn: 'ড্যাশবোর্ড', descEn: 'Today\'s KPIs and quick actions', descBn: 'আজকের কেপিআই ও কুইক অ্যাকশন', color: 'indigo' },
            { icon: Building2, labelEn: 'Companies', labelBn: 'কোম্পানি', descEn: 'Register supplier brands', descBn: 'সরবরাহকারী ব্র্যান্ড নিবন্ধন', color: 'cyan' },
            { icon: Package, labelEn: 'Products', labelBn: 'পণ্য', descEn: 'Full product catalog + pricing', descBn: 'সম্পূর্ণ পণ্য ক্যাটালগ + মূল্য', color: 'emerald' },
            { icon: MapPin, labelEn: 'Routes & SRs', labelBn: 'রুট ও এসআর', descEn: 'SR logins and delivery beats', descBn: 'এসআর লগইন ও ডেলিভারি বিট', color: 'orange' },
            { icon: BoxSelect, labelEn: 'Purchase', labelBn: 'ক্রয়', descEn: 'Receive stock from suppliers', descBn: 'সরবরাহকারী থেকে স্টক গ্রহণ', color: 'orange' },
            { icon: Wrench, labelEn: 'Stock Adjustment', labelBn: 'স্টক অ্যাডজাস্টমেন্ট', descEn: 'Fix inventory & track damage', descBn: 'ইনভেন্টরি ঠিক ও ক্ষতি ট্র্যাক', color: 'rose' },
            { icon: ShoppingCart, labelEn: 'Sales Terminal', labelBn: 'বিক্রয় টার্মিনাল', descEn: 'POS — create sales orders', descBn: 'পিওএস — বিক্রয় অর্ডার তৈরি', color: 'pink' },
            { icon: Truck, labelEn: 'Delivery Challans', labelBn: 'ডেলিভারি চালান', descEn: 'Track and dispatch orders', descBn: 'অর্ডার ট্র্যাক ও ডিসপ্যাচ', color: 'sky' },
            { icon: Wallet, labelEn: 'Expenses', labelBn: 'খরচ', descEn: 'Log expenses, calculate profit', descBn: 'খরচ লগ, মুনাফা গণনা', color: 'teal' },
            { icon: BarChart3, labelEn: 'Reports', labelBn: 'রিপোর্ট', descEn: 'Stock, sales & profit analytics', descBn: 'স্টক, বিক্রয় ও মুনাফা বিশ্লেষণ', color: 'violet' },
            { icon: Settings, labelEn: 'Settings', labelBn: 'সেটিংস', descEn: 'Branding, users, warehouses', descBn: 'ব্র্যান্ডিং, ব্যবহারকারী, গুদাম', color: 'slate' },
          ].map((item) => {
            const Icon = item.icon;
            const c = colorMap[item.color] ?? colorMap.slate;
            return (
              <div key={item.labelEn} className={`${c.bg} border ${c.border} rounded-2xl p-3.5 flex items-start gap-3`}>
                <div className={`w-8 h-8 rounded-xl bg-white/60 border ${c.border} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${c.text}`} />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-800">{t(item.labelEn, item.labelBn)}</div>
                  <div className="text-[10px] text-slate-500 font-medium mt-0.5">{t(item.descEn, item.descBn)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-transparent to-indigo-900/20 pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center justify-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-violet-400" />
            <span className="text-white font-black text-base">Bangla-Chain ERP</span>
            <span className="px-2 py-0.5 rounded-full bg-violet-500/30 border border-violet-400/30 text-violet-300 text-[10px] font-bold">v3.1</span>
          </div>
          <p className="text-slate-400 text-xs font-semibold">
            {t(
              'Built for Bangladeshi FMCG Distributors • Complete offline distribution management',
              'বাংলাদেশের এফএমসিজি পরিবেশকদের জন্য তৈরি • সম্পূর্ণ অফলাইন ডিস্ট্রিবিউশন ম্যানেজমেন্ট'
            )}
          </p>
          <div className="w-12 h-px bg-slate-700 mx-auto my-3" />
          <p className="text-slate-500 text-[11px] font-medium">
            {t('Crafted by', 'নির্মাতা')}{' '}
            <a
              href="https://almumeetusaikat.me"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 font-bold transition-colors"
            >
              Al Mumeetu Saikat
            </a>
            {' '}•{' '}
            <a
              href="https://almumeetusaikat.me"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-slate-400 transition-colors"
            >
              almumeetusaikat.me
            </a>
          </p>
        </div>
      </div>

    </div>
  );
}
