// Master data for the Financial Investigation Letters generator —
// 12 authorities to write to, the 18 fixed relations from the Master
// Relative Details form, and the standard preamble.
//
// This tool is meant for the whole Himachal Pradesh Police, so there are no
// hardcoded station or district names. Every officer types their own
// station details into the letterhead form at runtime.

window.LETTERS_DATA = (function () {

  // Authorities to write to — 12 distinct letters. `id` is used everywhere;
  // `to` is rendered in the To-block; `slots` are the per-letter blanks the
  // IO must fill (in addition to the global case data).
  const AUTHORITIES = [
    {
      id: "L1",
      code: "Banks",
      title: "Banks &amp; Post Offices (Concerned Branches)",
      subtitle: "u/s 94 BNSS — bank statements, FDs, lockers, KYC for last 6 years",
      hint: "Sent to the Postmaster + each Branch Manager whose KYC may apply.",
      defaultDays: 15,
      slots: [
        { id: "competentAuthority", label: "Competent Authority (u/s 68D NDPS)", placeholder: "The Competent Authority &amp; Administrator, SAFEM(FOP)A &amp; NDPS, Mumbai" },
        { id: "postOffice",         label: "Sub-Post Office (name &amp; location)", placeholder: "Sub-Post Office ____________, Tehsil ____________, Distt. ____________" },
        { id: "branchList",         label: "Bank Branches (one per line)", multiline: true, placeholder: "SBI, Branch __________ (IFSC __________)\nPNB, Branch __________\nHDFC Bank, Branch __________\nLocal Cooperative Bank, Branch __________" },
      ],
    },
    {
      id: "L2",
      code: "IncomeTax",
      title: "Pr. Commissioner of Income Tax",
      subtitle: "u/s 94 BNSS r/w § 138 IT Act — ITRs for last 6 AY + Form 46",
      hint: "Generates the body letter AND the Form 46 application.",
      defaultDays: 5,
      slots: [
        { id: "addressee", label: "Addressee", placeholder: "The Pr. Commissioner of Income Tax-__, Aayakar Bhawan, __________" },
      ],
    },
    {
      id: "L3",
      code: "TCP-Municipal",
      title: "Town &amp; Country Planner / Municipal Committee",
      subtitle: "u/s 94 BNSS — building-plan / map / construction approvals (6 years)",
      hint: "Goes to BOTH the Town &amp; Country Planner AND the Municipal Committee.",
      defaultDays: 15,
      slots: [
        { id: "tcpOffice",  label: "Town &amp; Country Planner — office", placeholder: "Office of Town &amp; Country Planner, ____________" },
        { id: "tcpEmail",   label: "Town &amp; Country Planner — email", placeholder: "tcp.____________@hp.gov.in" },
        { id: "mcOffice",   label: "Municipal Committee", placeholder: "Municipal Committee ____________" },
        { id: "mcEmail",    label: "Municipal Committee — email", placeholder: "mc.____________@hp.gov.in" },
      ],
    },
    {
      id: "L4",
      code: "Electricity",
      title: "Asst. Executive Engineer, Electricity Department",
      subtitle: "u/s 94 BNSS — connections, sanctioned load, application forms (6 years)",
      defaultDays: 15,
      slots: [
        { id: "subDivision", label: "Electricity Sub-Division", placeholder: "Electricity Sub-Division ____________, HPSEBL" },
      ],
    },
    {
      id: "L5",
      code: "RTO",
      title: "RTO / Registering &amp; Licensing Authority",
      subtitle: "u/s 94 BNSS — vehicles registered in last 6 years, RCs, hypothecation",
      defaultDays: 15,
      slots: [
        { id: "rtoOffice", label: "RTO Office", placeholder: "Regional Transport Officer, ____________" },
        { id: "rlaList",   label: "Other Registering Authorities (one per line)", multiline: true, placeholder: "SDM-cum-Registering Authority, ____________\nSDM-cum-Registering Authority, ____________" },
      ],
    },
    {
      id: "L6",
      code: "Tehsildar",
      title: "Registrar / Sub-Registrar (Tehsildar / Naib Tehsildar)",
      subtitle: "u/s 94 BNSS — immovable property: sale-deeds, mutations, title docs",
      defaultDays: 15,
      slots: [
        { id: "tehsildar",   label: "Registrar-cum-Tehsildar, Tehsil", placeholder: "Tehsil ____________, Distt. ____________" },
        { id: "subRegistrar",label: "Sub-Registrar-cum-Naib-Tehsildar, Sub-Tehsil", placeholder: "Sub-Tehsil ____________, Distt. ____________" },
      ],
    },
    {
      id: "L7",
      code: "Patwari",
      title: "Village Revenue Officer / Patwari",
      subtitle: "u/s 94 BNSS — Girdawari, Kisan Passbooks, land mutations (6 years)",
      defaultDays: 15,
      slots: [
        { id: "village", label: "Village(s) / Patwar Circle", placeholder: "Patwar Circle ____________, Tehsil ____________" },
      ],
    },
    {
      id: "L8",
      code: "DC",
      title: "Deputy Commissioner of the concerned District",
      subtitle: "u/s 94 BNSS — land/house/commercial/agri property of accused &amp; associates",
      defaultDays: 15,
      slots: [
        { id: "dcOffice", label: "DC Office", placeholder: "Office of the Deputy Commissioner, District ____________, H.P. — ______" },
      ],
    },
    {
      id: "L9",
      code: "DLR",
      title: "Director, Land Records · Dept. of Revenue, H.P.",
      subtitle: "u/s 94 BNSS — Jamabandi, mutation entries, Record of Rights",
      defaultDays: 15,
      slots: [
        { id: "dlrAddress", label: "Director Address", placeholder: "Directorate of Land Records, Department of Revenue, Govt. of Himachal Pradesh, Shimla — 171002" },
        { id: "dlrEmail",   label: "Director Email",   placeholder: "dlr-hp@nic.in" },
      ],
    },
    {
      id: "L10",
      code: "NaibTehsildar-Eval",
      title: "Sub-Registrar-cum-Naib-Tehsildar (for VALUATION)",
      subtitle: "u/s 94 BNSS — current circle rate / market value / valuation basis",
      defaultDays: 10,
      slots: [
        { id: "evalOffice",  label: "Sub-Tehsil for valuation", placeholder: "Sub-Tehsil ____________, Distt. ____________" },
        { id: "refLetterNo", label: "Reference (our earlier letter No.)", placeholder: "as on Sl. No. L6 above" },
      ],
    },
    {
      id: "L11",
      code: "IRDAI",
      title: "IRDAI — Insurance Regulatory &amp; Development Authority of India",
      subtitle: "u/s 94 BNSS — life / health / general / ULIP / annuity policies",
      defaultDays: 20,
      slots: [],
      fixedAddress: "The Chairperson / Authorized Officer\nInsurance Regulatory and Development Authority of India (IRDAI)\nSy. No. 115/1, Financial District, Nanakramguda, Gachibowli\nHyderabad – 500032",
    },
    {
      id: "L12",
      code: "Immigration",
      title: "Foreigners Division / Bureau of Immigration, MHA",
      subtitle: "u/s 94 BNSS — foreign travel records, visa, embarkation/arrival (6 years)",
      defaultDays: 20,
      slots: [],
      fixedAddress: "The Foreigners Division / Authorized Officer\nBureau of Immigration, Ministry of Home Affairs\nGovernment of India\nMajor Dhyan Chand National Stadium, India Gate Circle\nNew Delhi – 110002",
    },
  ];

  // 18 fixed relations from the Master Relative Details Form
  const RELATIONS = [
    "Wife / Husband",
    "Father",
    "Mother",
    "Son",
    "Daughter",
    "Grandfather",
    "Grandmother",
    "Grandson",
    "Granddaughter",
    "Brother",
    "Sister",
    "Brother’s Wife",
    "Sister’s Husband",
    "Brother-in-law (Wife’s Brother)",
    "Sister-in-law (Wife’s Sister)",
    "Father-in-law",
    "Mother-in-law",
    "Any Other Dependent Relative",
  ];

  // Common section text used as a sub-heading inside every letter
  const PREAMBLE_BNSS = "Section 94 of the Bharatiya Nagarik Suraksha Sanhita, 2023";

  return { AUTHORITIES, RELATIONS, PREAMBLE_BNSS };
})();
