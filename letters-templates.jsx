import React from 'react';
import { HPLogo, HP_NAME_EN, HP_NAME_HI, HP_MOTTO } from './branding.jsx';

// 12 letter templates for NDPS Financial Investigation, all driven by the
// single caseData object the IO fills in once.  Each template is a React
// component that returns a print-ready A4 letter.  Letterhead, subject,
// reference, particulars-of-accused table, requisition list, transmission
// block, and signature block are uniform — only the body of the requisition
// varies per authority.

const { Fragment: LFragment } = React;

// ─────────────────────────────────────────────────────────────────────────
// Shared bits
// ─────────────────────────────────────────────────────────────────────────
function fmt(d) {
  if (!d) return "____________";
  // d expected in dd-mm-yyyy or yyyy-mm-dd or empty
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, dd] = d.split("-");
    return `${dd}-${m}-${y}`;
  }
  return d;
}
function safe(v, dash = "____________") { return v && String(v).trim() ? v : dash; }
function lines(v) {
  if (!v) return [];
  return String(v).split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}

// Police-station letterhead — all titles editable per officer / station.
function LetterHead({ station, titles, urgent = "URGENT MATTER / TIME BOUND" }) {
  const govt = titles?.govt || "GOVERNMENT OF HIMACHAL PRADESH";
  const dept = titles?.dept || HP_NAME_EN;
  const districtLine = [station.district && `District ${station.district}`, station.subdivision && `Sub-Division ${station.subdivision}`].filter(Boolean).join(' · ');
  return (
    <div className="ll-head">
      <div className="ll-emblem" aria-hidden="true">
        <img src="/HPP.png" alt="Himachal Pradesh Police" style={{ width: 160, height: 160, objectFit: 'contain' }} />
      </div>
      <div className="ll-titleblock">
        <div className="ll-govt">{govt}</div>
        <div className="ll-dept">{dept.toUpperCase()} &nbsp;·&nbsp; {HP_NAME_HI}{districtLine && <> &nbsp;·&nbsp; {districtLine}</>}</div>
        <div className="ll-station">OFFICE OF THE STATION HOUSE OFFICER</div>
        <div className="ll-station-name">{(station.name || '').toUpperCase() || '— Police Station name —'}</div>
        <div className="ll-station-meta">
          {station.address || '— address —'}
          {(station.phone || station.email) && <> &nbsp;·&nbsp; {station.phone && <>Phone: {station.phone}</>}{station.phone && station.email && ' · '}{station.email && <>Email: {station.email}</>}</>}
        </div>
      </div>
      <div className="ll-urgent">{urgent}</div>
    </div>
  );
}

// Reference number row
function LetterRef({ refNo, date }) {
  return (
    <div className="ll-refrow">
      <div>No. <b>{safe(refNo)}</b></div>
      <div>Dated: <b>{fmt(date)}</b></div>
    </div>
  );
}

// "To" block — accepts an array of address lines OR a multiline string
function ToBlock({ to }) {
  const list = Array.isArray(to) ? to : (to || "").split("\n").map(s => s.trim()).filter(Boolean);
  return (
    <div className="ll-to">
      <div className="ll-to-lbl">To,</div>
      {list.map((l, i) => <div key={i} className="ll-to-line">{l}</div>)}
    </div>
  );
}

// Subject line
function Subject({ children }) {
  return (
    <div className="ll-subject">
      <span className="ll-subj-lbl">Subject:&nbsp;</span>{children}
    </div>
  );
}

// Recital paragraph
function P({ children, indent = false }) {
  return <p className={"ll-p " + (indent ? "indent" : "")}>{children}</p>;
}

// Particulars of accused/suspects table (uniform across all letters)
function ParticularsTable({ accused, suspects, includePassport = false }) {
  const all = [
    ...(accused || []).map(a => ({ ...a, type: "Accused" })),
    ...(suspects || []).map(s => ({ ...s, type: "Suspect" })),
  ];
  // pad to at least 6 rows for the official look
  while (all.length < 6) all.push({ name: "", fatherName: "", address: "", id: "", passport: "", type: "" });
  return (
    <div className="ll-tablewrap">
      <div className="ll-tabletitle">Particulars of Accused / Suspects</div>
      <table className="ll-table">
        <thead>
          <tr>
            <th style={{ width: 40 }}>Sr. No.</th>
            <th style={{ width: 60 }}>Type</th>
            <th>Name</th>
            <th>Father's / Mother's Name</th>
            <th>Address</th>
            {includePassport && <th style={{ width: 110 }}>Passport No.</th>}
            <th style={{ width: 150 }}>ID No. (Aadhaar / PAN / Other)</th>
          </tr>
        </thead>
        <tbody>
          {all.map((p, i) => (
            <tr key={i}>
              <td className="num">{i + 1}</td>
              <td className="mono">{p.type}</td>
              <td>{p.name}</td>
              <td>{p.fatherName}</td>
              <td className="addr">{p.address}</td>
              {includePassport && <td className="mono">{p.passport}</td>}
              <td className="mono">{p.id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// "Yours sincerely / Officer in Charge" signature block
function Signature({ io, station }) {
  return (
    <div className="ll-sig">
      <div className="ll-sig-yours">Yours sincerely,</div>
      <div className="ll-sig-line" />
      <div className="ll-sig-name">{safe(io?.name)}</div>
      <div className="ll-sig-rank">{safe(io?.rank)} · {safe(io?.role)}</div>
      <div className="ll-sig-station">Officer in Charge · {station.name}</div>
    </div>
  );
}

// Transmission block (uniform paragraph in every letter)
function Transmission({ station, io, daysToReply }) {
  return (
    <div className="ll-block">
      <P>The requested information may kindly be transmitted —</P>
      <ol className="ll-ol-loose">
        <li>In <b>soft copy</b> through official email at: <span className="under">{safe(io?.email || station.email)}</span>; and</li>
        <li>In <b>hard copy</b> addressed to —
          <div className="ll-addrblock">
            The Officer-in-Charge, {station.name},<br/>
            District {station.district}, State {station.state} — PIN {station.pin}.
          </div>
        </li>
      </ol>
      <P>
        The matter is <b>urgent and time-bound</b>. The financial investigation is required to be completed within the
        statutory period from the date of registration of the FIR. You are therefore requested to furnish the requisite
        information within <b>{safe(daysToReply, "______")} days</b> from receipt of this notice.
      </P>
    </div>
  );
}

// Standard opening preamble shared by every letter (FIR / commencement of Ch. VA)
function StandardOpening({ fir, station, sectionLine = "Sections" }) {
  return (
    <div style={{ display: "contents" }}>
      <P>Kindly refer to the subject cited above.</P>
      <P>
        It is submitted that <b>FIR No. {safe(fir.no)}</b> dated <b>{fmt(fir.date)}</b> under {sectionLine}&nbsp;
        <b>{safe(fir.sections)}</b> of the Narcotic Drugs and Psychotropic Substances Act, 1985 has been registered at&nbsp;
        <b>{station.name}</b>, District <b>{station.district}</b>, wherein recovery of commercial quantity of contraband
        ({safe(fir.contraband)}) and/or other incriminating material has been effected from the possession of the
        accused person(s). The accused person(s) have been arrested and are presently in judicial custody.
      </P>
      <P>
        In view of the recovery involving commercial quantity, financial investigation proceedings have been initiated
        under <b>Chapter V-A of the NDPS Act, 1985</b> for identification, tracing and verification of illegally
        acquired property.
      </P>
    </div>
  );
}

// Wrapper — A4 page with consistent margins + faint HPP watermark behind text
function LetterPage({ id, children, footer }) {
  return (
    <div className="ll-page" data-letter-id={id}>
      <img src="/HPP.png" alt="" aria-hidden="true" className="ll-watermark" />
      <div className="ll-pageinner">{children}</div>
      {footer && <div className="ll-page-footer">{footer}</div>}
    </div>
  );
}

const { Fragment } = React;

// ─────────────────────────────────────────────────────────────────────────
// Letter helpers per authority
// ─────────────────────────────────────────────────────────────────────────

function L_Banks({ caseData }) {
  const { station, io, fir, accused, suspects, slotData } = caseData;
  const days = caseData.perLetterDays?.L1 ?? 15;
  const branches = lines(slotData?.L1?.branchList);
  const toLines = ["The Postmaster, Sub-Post Office __________________________",
    ...branches.map(b => `The Branch Manager, ${b}`)];
  if (toLines.length < 8) for (let i = toLines.length; i < 8; i++) toLines.push("The Branch Manager, __________________________");
  return (
    <LetterPage id="L1">
      <LetterHead station={station} titles={caseData.letterheadTitles} />
      <LetterRef refNo={caseData.refNo?.L1 || `__/5A/${fir.no}`} date={caseData.letterDate} />
      <ToBlock to={toLines} />
      <Subject>
        Notice under <b>Section 94 of the Bharatiya Nagarik Suraksha Sanhita, 2023</b> for furnishing
        bank account statements and financial details of accused and suspects involved in FIR No.&nbsp;
        <b>{safe(fir.no)}</b> registered under Sections <b>{safe(fir.sections)}</b> of the NDPS Act, 1985.
      </Subject>
      <P>Sir / Madam,</P>
      <StandardOpening fir={fir} station={station} />
      <ParticularsTable accused={accused} suspects={suspects} />
      <div className="ll-block">
        <div className="ll-h2">Requisition</div>
        <P>
          In exercise of powers conferred under <b>Section 94 BNSS, 2023</b>, you are hereby requested to furnish the
          following information for the last <b>six (6) years</b> up to date in respect of the above-mentioned persons,
          if any accounts / investments are maintained in your branch —
        </P>
        <ol className="ll-ol">
          <li>Certified statements of all <b>savings / current / OD / CC</b> accounts.</li>
          <li>Details of <b>fixed deposits, recurring deposits and term deposits</b>.</li>
          <li>Details of <b>lockers</b> allotted, if any.</li>
          <li>Details of <b>loans, advances and credit facilities</b> sanctioned.</li>
          <li>Details of <b>mutual funds, shares, DEMAT accounts</b> and other investment products.</li>
          <li>Details of <b>insurance policies</b> issued through your branch.</li>
          <li><b>KYC documents</b> submitted at the time of opening the account.</li>
        </ol>
        <P>
          You are further requested <b>not to permit any unusual or suspicious transactions</b> and to intimate this
          office immediately in case of any high-value transaction, pending appropriate legal orders regarding
          seizure / freezing from the Competent Authority u/s 68D of the NDPS Act, 1985.
        </P>
        <P>
          The above information is required for the purpose of financial investigation under Chapter V-A of the NDPS
          Act, 1985 to ascertain whether any assets or monetary instruments have been acquired from proceeds of
          illicit trafficking.
        </P>
      </div>
      <Transmission station={station} io={io} daysToReply={days} />
      <Signature io={io} station={station} />
    </LetterPage>
  );
}

function L_IncomeTax({ caseData }) {
  const { station, io, fir, accused, suspects, slotData } = caseData;
  const days = caseData.perLetterDays?.L2 ?? 5;
  const addressee = slotData?.L2?.addressee || "The Pr. Commissioner of Income Tax-1, Aayakar Bhawan, Sector 17-E, Chandigarh – 160017";
  const toLines = addressee.split(",").map(s => s.trim()).filter(Boolean);
  return (
    <div style={{ display: "contents" }}>
      <LetterPage id="L2">
        <LetterHead station={station} titles={caseData.letterheadTitles} urgent="MOST IMMEDIATE" />
        <LetterRef refNo={caseData.refNo?.L2 || `__/IT/${fir.no}`} date={caseData.letterDate} />
        <ToBlock to={toLines} />
        <Subject>
          Notice under <b>Section 94 BNSS, 2023 read with Section 138 of the Income-tax Act, 1961</b> for furnishing
          copies of <b>Income Tax Returns for the last six (6) Assessment Years</b> in connection with FIR No.&nbsp;
          <b>{safe(fir.no)}</b> registered under Section <b>{safe(fir.sections)}</b> of the NDPS Act, 1985.
        </Subject>
        <P>Sir,</P>
        <StandardOpening fir={fir} station={station} sectionLine="Section" />
        <P>
          For the purpose of completing the financial investigation within the statutory period prescribed from the
          date of registration of the FIR, it is necessary to obtain the <b>Income Tax Returns (ITRs)</b> of the
          accused person(s) and suspect(s) for the last <b>six (6) Assessment Years</b>.
        </P>
        <P>The particulars of the concerned accused person(s) and suspect(s) are as under:</P>
        <ParticularsTable accused={accused} suspects={suspects} />
        <P>
          Therefore, being a <b>Nodal Officer</b>, you are respectfully requested to furnish the Income Tax Returns
          for the last six Assessment Years in respect of the above-mentioned accused and suspect(s), whose
          particulars have been duly provided in the prescribed <b>Form No. 46 (Rule 113)</b> under the Income-tax
          Act, 1961, enclosed herewith.
        </P>
        <Transmission station={station} io={io} daysToReply={days} />
        <P><b>Encl:</b> Form 46 — 06 pages</P>
        <Signature io={io} station={station} />
        <P className="ll-endst">
          <b>Endst.</b> No. as above — Dated: {fmt(caseData.letterDate)}<br/>
          Copy forwarded to the Station House Officer, {station.name}.
        </P>
      </LetterPage>
      {/* FORM 46 — separate page, one per assessee/AY in practice; here we render one specimen */}
      <LetterPage id="L2-Form46" footer="A separate application shall be made in respect of each assessee and for each Assessment Year.">
        <div className="ll-form46-head">
          <div className="ll-form46-title">FORM NO. 46</div>
          <div className="ll-form46-sub">[See Rule 113]</div>
          <div className="ll-form46-sub">
            Application for information under clause (b) of sub-section (1) of <b>Section 138 of the Income-tax Act, 1961</b>
          </div>
        </div>
        <ToBlock to={toLines} />
        <P>Sir / Madam,</P>
        <P>I request you to furnish information relating to —</P>
        <div className="ll-formgrid">
          <div className="ll-fld"><div className="lbl">Name of the Assessee</div><div className="val">{(accused?.[0]?.name) || ""}</div></div>
          <div className="ll-fld"><div className="lbl">Status (Individual / Firm / Company / Other)</div><div className="val">{accused?.[0]?.status || "Individual"}</div></div>
          <div className="ll-fld"><div className="lbl">Permanent Account Number (PAN), if known</div><div className="val mono">{accused?.[0]?.pan || ""}</div></div>
          <div className="ll-fld"><div className="lbl">Complete Address</div><div className="val">{accused?.[0]?.address || ""}</div></div>
          <div className="ll-fld"><div className="lbl">Assessment Year(s)</div><div className="val">AY {caseData.ayFrom || "2019-20"} to AY {caseData.ayTo || "2024-25"} (six years)</div></div>
        </div>
        <P><b>Information sought —</b></P>
        <ol className="ll-ol">
          <li>Certified copy of the Income Tax Return filed for each Assessment Year.</li>
          <li>Details of total income declared and sources thereof.</li>
          <li>Copy of Balance Sheet, Capital Account and Profit &amp; Loss Account, if filed.</li>
          <li>Details of movable and immovable assets disclosed.</li>
          <li>Details of investments and financial instruments declared.</li>
          <li>Details of loans, advances, liabilities and unsecured borrowings disclosed.</li>
          <li>Details of bank accounts reported in the return.</li>
          <li>Copies of assessment orders, if any, passed for the relevant Assessment Year.</li>
        </ol>
        <P><b>Reasons for requiring the information —</b></P>
        <P>
          The information is required in connection with an ongoing financial investigation arising out of <b>FIR No.&nbsp;
          {safe(fir.no)}</b> dated <b>{fmt(fir.date)}</b>, registered under Section <b>{safe(fir.sections)}</b> of the
          NDPS Act, 1985. The case involves recovery of commercial quantity of contraband, thereby attracting the
          provisions of <b>Chapter V-A of the NDPS Act, 1985</b> relating to identification, tracing and forfeiture
          of illegally acquired property.
        </P>
        <P>In order to —</P>
        <ol className="ll-ol-roman">
          <li>Examine the financial status, sources of income and declared assets of the accused / suspect(s);</li>
          <li>Verify the legitimacy of income disclosed to the Income-tax Department;</li>
          <li>Identify any disproportionate assets or unexplained income;</li>
          <li>Trace proceeds of crime and determine whether any property has been acquired out of illicit trafficking;</li>
          <li>Ascertain potential <i>benami</i> holdings or indirect financial interests; and</li>
          <li>Complete the financial investigation within the statutory time frame prescribed under the NDPS Act,</li>
        </ol>
        <P>
          it is necessary to obtain certified copies of the Income Tax Returns and related financial disclosures for
          the relevant Assessment Years.
        </P>
        <Signature io={io} station={station} />
      </LetterPage>
    </div>
  );
}

function L_TCPMunicipal({ caseData }) {
  const { station, io, fir, accused, suspects, slotData } = caseData;
  const days = caseData.perLetterDays?.L3 ?? 15;
  const tcp = slotData?.L3?.tcpOffice || "The Town & Country Planner, __________";
  const tcpEmail = slotData?.L3?.tcpEmail || "____________________";
  const mc  = slotData?.L3?.mcOffice  || "The Executive Officer, Municipal Committee";
  const mcEmail  = slotData?.L3?.mcEmail  || "____________________";
  return (
    <LetterPage id="L3">
      <LetterHead station={station} titles={caseData.letterheadTitles} urgent="MOST IMMEDIATE · TIME BOUND" />
      <LetterRef refNo={caseData.refNo?.L3 || `__/TCP/${fir.no}`} date={caseData.letterDate} />
      <ToBlock to={[
        `${tcp}`, `E-mail: ${tcpEmail}`, "",
        `${mc}`,  `E-mail: ${mcEmail}`,
      ]} />
      <Subject>
        Notice under <b>Section 94 BNSS, 2023</b> for furnishing details of <b>building plans / maps and construction
        projects approved during the last six (6) years</b> in respect of accused and suspects involved in FIR No.&nbsp;
        <b>{safe(fir.no)}</b> registered under Sections <b>{safe(fir.sections)}</b> of the NDPS Act, 1985.
      </Subject>
      <P>Respected Sir / Madam,</P>
      <StandardOpening fir={fir} station={station} />
      <P>The particulars of the accused and suspects are as under:</P>
      <ParticularsTable accused={accused} suspects={suspects} />
      <div className="ll-block">
        <div className="ll-h2">Requisition</div>
        <P>
          In exercise of powers conferred under <b>Section 94 BNSS, 2023</b>, you are hereby requested to furnish the
          following information in respect of the above-mentioned persons for the last <b>six (6) years</b> —
        </P>
        <ol className="ll-ol">
          <li>Details of <b>building plans / maps</b> sanctioned or approved.</li>
          <li>Copies of <b>approved site plans and building layout plans</b>.</li>
          <li>Details of <b>construction permissions</b> granted.</li>
          <li>Copies of <b>completion / occupancy certificates</b> issued, if any.</li>
          <li>Details of <b>commercial construction approvals</b>, if any.</li>
          <li>Details of <b>ownership particulars</b> as recorded in your office at the time of approval.</li>
        </ol>
        <P>
          The above information is required for the purpose of financial investigation under Chapter V-A of the NDPS
          Act, 1985 to ascertain whether any <b>immovable property</b> has been acquired from proceeds of illicit
          trafficking.
        </P>
      </div>
      <Transmission station={station} io={io} daysToReply={days} />
      <Signature io={io} station={station} />
    </LetterPage>
  );
}

function L_Electricity({ caseData }) {
  const { station, io, fir, accused, suspects, slotData } = caseData;
  const days = caseData.perLetterDays?.L4 ?? 15;
  const sd = slotData?.L4?.subDivision || "Electricity Sub-Division __________ , HPSEBL";
  return (
    <LetterPage id="L4">
      <LetterHead station={station} titles={caseData.letterheadTitles} urgent="MOST IMMEDIATE · TIME BOUND" />
      <LetterRef refNo={caseData.refNo?.L4 || `__/ELE/${fir.no}`} date={caseData.letterDate} />
      <ToBlock to={["The Assistant Executive Engineer,", sd]} />
      <Subject>
        Notice under <b>Section 94 BNSS, 2023</b> for furnishing details of <b>electricity connections / meters
        sanctioned or installed during the last six (6) years</b> in respect of accused and suspects involved in
        FIR No. <b>{safe(fir.no)}</b> under Sections <b>{safe(fir.sections)}</b> of the NDPS Act, 1985.
      </Subject>
      <P>Respected Sir / Madam,</P>
      <StandardOpening fir={fir} station={station} />
      <ParticularsTable accused={accused} suspects={suspects} />
      <div className="ll-block">
        <div className="ll-h2">Requisition</div>
        <P>You are hereby requested to furnish, for the last <b>six (6) years</b> —</P>
        <ol className="ll-ol">
          <li>Details of <b>electricity connections</b> sanctioned / installed in their names.</li>
          <li>Copies of <b>application forms</b> submitted for obtaining electricity connections.</li>
          <li>Details of <b>consumer number, category</b> (domestic / commercial / industrial), and <b>sanctioned load</b>.</li>
          <li><b>Date of installation</b> and <b>address</b> of premises where connection is installed.</li>
          <li>Details of <b>ownership / occupancy documents</b> submitted at the time of grant of connection.</li>
          <li>Copies of any <b>load enhancement / reduction</b> approvals granted.</li>
          <li>Details of <b>disconnections</b>, if any, and reasons thereof.</li>
        </ol>
        <P>
          The above information is required for the purpose of financial investigation under Chapter V-A of the NDPS
          Act, 1985 to ascertain the existence of undisclosed properties, commercial activities and possible assets
          acquired from proceeds of illicit trafficking.
        </P>
      </div>
      <Transmission station={station} io={io} daysToReply={days} />
      <Signature io={io} station={station} />
    </LetterPage>
  );
}

function L_RTO({ caseData }) {
  const { station, io, fir, accused, suspects, slotData } = caseData;
  const days = caseData.perLetterDays?.L5 ?? 15;
  const rto = slotData?.L5?.rtoOffice || "The Regional Transport Officer, ____________________";
  const list = lines(slotData?.L5?.rlaList);
  const toLines = [rto, ...list.map(l => `The Registering & Licensing Authority, ${l}`)];
  return (
    <LetterPage id="L5">
      <LetterHead station={station} titles={caseData.letterheadTitles} urgent="MOST IMMEDIATE · TIME BOUND" />
      <LetterRef refNo={caseData.refNo?.L5 || `__/RTO/${fir.no}`} date={caseData.letterDate} />
      <ToBlock to={toLines} />
      <Subject>
        Notice under <b>Section 94 BNSS, 2023</b> for furnishing details of <b>vehicles registered in the names of
        accused and suspects</b> involved in FIR No. <b>{safe(fir.no)}</b> under Sections <b>{safe(fir.sections)}</b>
        &nbsp;of the NDPS Act, 1985.
      </Subject>
      <P>Sir / Madam,</P>
      <StandardOpening fir={fir} station={station} />
      <ParticularsTable accused={accused} suspects={suspects} />
      <div className="ll-block">
        <div className="ll-h2">Requisition</div>
        <P>For the last <b>six (6) years</b> —</P>
        <ol className="ll-ol">
          <li>Details of all <b>motor vehicles</b> registered in their names.</li>
          <li>Copies of <b>Registration Certificates (RCs)</b>.</li>
          <li>Details of <b>transfer of ownership</b>, if any.</li>
          <li>Details of <b>hypothecation / loan</b> entries recorded.</li>
          <li>Details of <b>commercial permits</b>, if issued.</li>
          <li>Details of any <b>cancellation, suspension or blacklisting</b> of registration.</li>
        </ol>
        <P>
          Required for financial investigation under Chapter V-A of the NDPS Act, 1985 to ascertain whether any
          <b> movable property (motor vehicles)</b> has been acquired from proceeds of illicit trafficking.
        </P>
      </div>
      <Transmission station={station} io={io} daysToReply={days} />
      <Signature io={io} station={station} />
    </LetterPage>
  );
}

function L_Tehsildar({ caseData }) {
  const { station, io, fir, accused, suspects, slotData } = caseData;
  const days = caseData.perLetterDays?.L6 ?? 15;
  const t = slotData?.L6?.tehsildar || "Tehsil ____________";
  const s = slotData?.L6?.subRegistrar || "Sub-Tehsil ____________";
  return (
    <LetterPage id="L6">
      <LetterHead station={station} titles={caseData.letterheadTitles} urgent="URGENT / TIME BOUND" />
      <LetterRef refNo={caseData.refNo?.L6 || `__/REV/${fir.no}`} date={caseData.letterDate} />
      <ToBlock to={[`The Registrar-cum-Tehsildar, ${t}`, `The Sub-Registrar-cum-Naib Tehsildar, ${s}`]} />
      <Subject>
        Notice under <b>Section 94 BNSS, 2023</b> for furnishing details of <b>immovable property acquired / owned</b>
        &nbsp;by accused and suspects involved in FIR No. <b>{safe(fir.no)}</b> under Sections <b>{safe(fir.sections)}</b>
        &nbsp;of the NDPS Act, 1985.
      </Subject>
      <P>Sir / Madam,</P>
      <StandardOpening fir={fir} station={station} />
      <ParticularsTable accused={accused} suspects={suspects} />
      <div className="ll-block">
        <div className="ll-h2">Requisition</div>
        <ol className="ll-ol">
          <li>Details of all <b>immovable properties</b> registered in their names — land, house, commercial,
              agricultural land, etc.</li>
          <li>Copies of <b>registered sale-deeds, gift-deeds, lease-deeds</b> or any other title documents.</li>
          <li>Details of <b>mutation entries</b> sanctioned in their favour.</li>
          <li>Nature of property — ancestral / inherited / gifted / purchased.</li>
          <li><b>Date of acquisition</b> and <b>consideration amount</b> mentioned in the registered document.</li>
          <li>Details of any property <b>transferred</b> by them during the last <b>six (6) years</b>.</li>
        </ol>
      </div>
      <Transmission station={station} io={io} daysToReply={days} />
      <Signature io={io} station={station} />
    </LetterPage>
  );
}

function L_Patwari({ caseData }) {
  const { station, io, fir, accused, suspects, slotData } = caseData;
  const days = caseData.perLetterDays?.L7 ?? 15;
  const v = slotData?.L7?.village || "Patwar Circle ____________ , Tehsil ____________";
  return (
    <LetterPage id="L7">
      <LetterHead station={station} titles={caseData.letterheadTitles} urgent="MOST IMMEDIATE · TIME BOUND" />
      <LetterRef refNo={caseData.refNo?.L7 || `__/PAT/${fir.no}`} date={caseData.letterDate} />
      <ToBlock to={["The Village Revenue Officer / Patwari,", v]} />
      <Subject>
        Notice under <b>Section 94 BNSS, 2023</b> for furnishing <b>Girdawari entries</b> and details of <b>Kisan
        Passbooks</b> issued in favour of accused and associates involved in FIR No. <b>{safe(fir.no)}</b> under
        Sections <b>{safe(fir.sections)}</b> of the NDPS Act, 1985.
      </Subject>
      <P>Sir / Madam,</P>
      <StandardOpening fir={fir} station={station} />
      <ParticularsTable accused={accused} suspects={suspects} />
      <div className="ll-block">
        <div className="ll-h2">Requisition</div>
        <P>For the last <b>six (6) years</b> preceding the date of registration of the FIR —</P>
        <ol className="ll-ol">
          <li>Certified photocopies of <b>Girdawari</b> entries pertaining to land owned, possessed or cultivated by them.</li>
          <li>Details of <b>Kisan Passbooks</b> issued in their favour — date of issuance and particulars of land.</li>
          <li>Details of any <b>mutation entries</b> sanctioned in their favour during the said period.</li>
          <li>Nature of land (agricultural / non-agricultural) and <b>extent of land holding</b> recorded in revenue records.</li>
        </ol>
      </div>
      <Transmission station={station} io={io} daysToReply={days} />
      <Signature io={io} station={station} />
    </LetterPage>
  );
}

function L_DC({ caseData }) {
  const { station, io, fir, accused, suspects, slotData } = caseData;
  const days = caseData.perLetterDays?.L8 ?? 15;
  const dc = slotData?.L8?.dcOffice || `Office of the Deputy Commissioner, District ${station.district}, ${station.state}`;
  return (
    <LetterPage id="L8">
      <LetterHead station={station} titles={caseData.letterheadTitles} urgent="URGENT / TIME BOUND" />
      <LetterRef refNo={caseData.refNo?.L8 || `__/DC/${fir.no}`} date={caseData.letterDate} />
      <ToBlock to={["The Deputy Commissioner,", dc]} />
      <Subject>
        Notice under <b>Section 94 BNSS, 2023</b> regarding furnishing details of <b>immovable property (land)</b>
        &nbsp;acquired / owned by accused person(s) and associate(s) involved in FIR No. <b>{safe(fir.no)}</b>
        &nbsp;under Sections <b>{safe(fir.sections)}</b> of the NDPS Act, 1985.
      </Subject>
      <P>Respected Sir / Madam,</P>
      <P><b>"Jai Hind"</b></P>
      <StandardOpening fir={fir} station={station} />
      <ParticularsTable accused={accused} suspects={suspects} />
      <div className="ll-block">
        <div className="ll-h2">Requisition</div>
        <P>
          You are respectfully requested to kindly direct all concerned Revenue / Registration Authorities under your
          jurisdiction to furnish the following information in respect of the above-mentioned persons —
        </P>
        <ol className="ll-ol">
          <li>Details of <b>immovable property</b> — land / house / commercial / agricultural — owned or acquired.</li>
          <li>Whether such property is <b>ancestral / inherited / gifted / self-acquired</b>.</li>
          <li>If purchased — <b>date of purchase, consideration amount, registration particulars</b>.</li>
          <li>Details of <b>mutation entries</b> sanctioned during the last six years preceding the FIR.</li>
          <li>Details of any <b>transfer of property</b> effected by them during the said period.</li>
        </ol>
      </div>
      <Transmission station={station} io={io} daysToReply={days} />
      <Signature io={io} station={station} />
    </LetterPage>
  );
}

function L_DLR({ caseData }) {
  const { station, io, fir, accused, suspects, slotData } = caseData;
  const days = caseData.perLetterDays?.L9 ?? 15;
  const a = slotData?.L9?.dlrAddress || "Directorate of Land Records, Department of Revenue, Govt. of H.P., Shimla — 171002";
  const e = slotData?.L9?.dlrEmail || "____________________";
  return (
    <LetterPage id="L9">
      <LetterHead station={station} titles={caseData.letterheadTitles} urgent="URGENT / TIME BOUND" />
      <LetterRef refNo={caseData.refNo?.L9 || `__/DLR/${fir.no}`} date={caseData.letterDate} />
      <ToBlock to={["The Director, Land Records,", "Department of Revenue,", a, `Email: ${e}`]} />
      <Subject>
        Notice under <b>Section 94 BNSS, 2023</b> for furnishing details of <b>immovable property (land)</b> acquired /
        owned by accused person(s) and associate(s) in connection with FIR No. <b>{safe(fir.no)}</b> under Sections&nbsp;
        <b>{safe(fir.sections)}</b> of the NDPS Act, 1985.
      </Subject>
      <P>Respected Sir / Madam,</P>
      <StandardOpening fir={fir} station={station} />
      <ParticularsTable accused={accused} suspects={suspects} />
      <div className="ll-block">
        <div className="ll-h2">Requisition</div>
        <ol className="ll-ol">
          <li>Details of <b>immovable property</b> — agricultural / non-agricultural / residential / commercial.</li>
          <li>Certified copies of <b>Jamabandi, Mutation entries and Record of Rights</b>.</li>
          <li>Whether such properties are <b>ancestral / inherited / gifted / self-acquired</b>.</li>
          <li>If purchased — <b>date of purchase, consideration amount, registration particulars</b>.</li>
          <li>Details of any <b>transfer, sale, mortgage or alienation</b> executed during the last six years preceding the FIR.</li>
        </ol>
      </div>
      <Transmission station={station} io={io} daysToReply={days} />
      <Signature io={io} station={station} />
    </LetterPage>
  );
}

function L_NaibTehsildarEval({ caseData }) {
  const { station, io, fir, accused, suspects, slotData } = caseData;
  const days = caseData.perLetterDays?.L10 ?? 10;
  const e = slotData?.L10?.evalOffice || "Sub-Tehsil ____________ , District " + station.district;
  const ref = slotData?.L10?.refLetterNo || "as on Sl. No. L6 above";
  return (
    <LetterPage id="L10">
      <LetterHead station={station} titles={caseData.letterheadTitles} urgent="URGENT / TIME BOUND" />
      <LetterRef refNo={caseData.refNo?.L10 || `__/VAL/${fir.no}`} date={caseData.letterDate} />
      <ToBlock to={["The Sub-Registrar-cum-Naib Tehsildar,", e]} />
      <Subject>
        Notice under <b>Section 94 BNSS, 2023</b> for furnishing <b>current value of immovable properties</b>
        &nbsp;owned / acquired by accused person(s) and associate(s) in connection with FIR No. <b>{safe(fir.no)}</b>
        &nbsp;under Sections <b>{safe(fir.sections)}</b> of the NDPS Act, 1985.
      </Subject>
      <P>Dear Sir / Madam,</P>
      <P>Kindly refer to this office letter <b>No. {ref}</b> dated <b>{fmt(caseData.letterDate)}</b> on the subject cited above.</P>
      <StandardOpening fir={fir} station={station} />
      <ParticularsTable accused={accused} suspects={suspects} />
      <div className="ll-block">
        <div className="ll-h2">Requisition</div>
        <ol className="ll-ol">
          <li><b>Current circle rate / guideline value</b> of immovable properties recorded in their names.</li>
          <li><b>Present estimated market value</b> for each such property.</li>
          <li><b>Basis / notification reference</b> under which the valuation has been determined.</li>
          <li>Any <b>revision of valuation</b> notified during the last six years preceding the FIR.</li>
        </ol>
      </div>
      <Transmission station={station} io={io} daysToReply={days} />
      <Signature io={io} station={station} />
    </LetterPage>
  );
}

function L_IRDAI({ caseData }) {
  const { station, io, fir, accused, suspects } = caseData;
  const days = caseData.perLetterDays?.L11 ?? 20;
  return (
    <LetterPage id="L11">
      <LetterHead station={station} titles={caseData.letterheadTitles} urgent="CONFIDENTIAL · URGENT" />
      <LetterRef refNo={caseData.refNo?.L11 || `__/INS/${fir.no}`} date={caseData.letterDate} />
      <ToBlock to={[
        "The Chairperson / Authorized Officer,",
        "Insurance Regulatory and Development Authority of India (IRDAI),",
        "Sy. No. 115/1, Financial District, Nanakramguda, Gachibowli,",
        "Hyderabad – 500032",
      ]} />
      <Subject>
        Notice under <b>Section 94 BNSS, 2023</b> for furnishing details of <b>insurance policies and related
        financial products</b> held by accused and suspects involved in FIR No. <b>{safe(fir.no)}</b> under
        Sections <b>{safe(fir.sections)}</b> of the NDPS Act, 1985.
      </Subject>
      <P>Respected Sir / Madam,</P>
      <StandardOpening fir={fir} station={station} />
      <ParticularsTable accused={accused} suspects={suspects} />
      <div className="ll-block">
        <div className="ll-h2">Requisition</div>
        <P>
          For the last <b>six (6) years</b>, from all insurance companies regulated by IRDAI, please furnish —
        </P>
        <ol className="ll-ol">
          <li>Details of all <b>life / health / general / ULIP / annuity / investment-linked insurance products</b>.</li>
          <li><b>Policy number(s)</b>, date of commencement, current status (active / matured / surrendered / lapsed).</li>
          <li><b>Sum assured</b> and premium amount (annual / single premium).</li>
          <li><b>Total premium paid till date</b>.</li>
          <li><b>Mode of payment</b> and <b>source bank account</b> used for premium payment.</li>
          <li>Current <b>surrender value</b> or <b>maturity value</b>.</li>
          <li>Details of <b>nominee(s)</b> and <b>beneficiary(ies)</b>.</li>
          <li>Details of any <b>loan against insurance policies</b>.</li>
          <li>Details of <b>assignment, transfer or change in ownership</b> of policy.</li>
          <li>Details of any <b>high-value single-premium policies</b> purchased.</li>
        </ol>
        <P>Required to ascertain whether any investment in insurance products has been made from proceeds of illicit trafficking.</P>
      </div>
      <Transmission station={station} io={io} daysToReply={days} />
      <P><i>Kindly treat this communication as confidential and urgent.</i></P>
      <Signature io={io} station={station} />
    </LetterPage>
  );
}

function L_Immigration({ caseData }) {
  const { station, io, fir, accused, suspects } = caseData;
  const days = caseData.perLetterDays?.L12 ?? 20;
  return (
    <LetterPage id="L12">
      <LetterHead station={station} titles={caseData.letterheadTitles} urgent="CONFIDENTIAL · URGENT" />
      <LetterRef refNo={caseData.refNo?.L12 || `__/BOI/${fir.no}`} date={caseData.letterDate} />
      <ToBlock to={[
        "The Foreigners Division / Authorized Officer,",
        "Bureau of Immigration,",
        "Ministry of Home Affairs, Government of India,",
        "Major Dhyan Chand National Stadium, India Gate Circle,",
        "New Delhi – 110002",
      ]} />
      <Subject>
        Notice under <b>Section 94 BNSS, 2023</b> for furnishing details of <b>foreign travel</b> undertaken by accused
        and suspects involved in FIR No. <b>{safe(fir.no)}</b> under Sections <b>{safe(fir.sections)}</b> of the NDPS Act, 1985.
      </Subject>
      <P>Respected Sir / Madam,</P>
      <StandardOpening fir={fir} station={station} />
      <ParticularsTable accused={accused} suspects={suspects} includePassport />
      <div className="ll-block">
        <div className="ll-h2">Requisition</div>
        <P>For the last <b>six (6) years</b> —</P>
        <ol className="ll-ol">
          <li>Details of all <b>foreign travel</b> undertaken (departure and arrival records).</li>
          <li><b>Date of departure</b> from India and <b>date of arrival</b> in India.</li>
          <li><b>Country visited</b>.</li>
          <li><b>Airport / Port of embarkation</b> and <b>arrival</b>.</li>
          <li><b>Visa type</b> and duration.</li>
          <li><b>Duration of stay abroad</b>.</li>
          <li>Any <b>frequent travel pattern</b> observed.</li>
          <li>Copies of <b>immigration movement records</b>, if permissible.</li>
        </ol>
        <P>The information is required to —</P>
        <ol className="ll-ol-roman">
          <li>Assess expenditure incurred on foreign travel;</li>
          <li>Examine source of funds utilised for such travel;</li>
          <li>Identify possible proceeds of illicit trafficking;</li>
          <li>Determine international financial links, if any.</li>
        </ol>
      </div>
      <Transmission station={station} io={io} daysToReply={days} />
      <P><i>Kindly treat this communication as confidential and urgent.</i></P>
      <Signature io={io} station={station} />
    </LetterPage>
  );
}

// Bonus — Master Relative Details form (renders the IO's filled relative table as a one-pager attachment)
function L_RelativesAttachment({ caseData }) {
  const { station, io, fir, accused, relatives } = caseData;
  return (
    <LetterPage id="L13">
      <LetterHead station={station} titles={caseData.letterheadTitles} urgent="ANNEXURE — CONFIDENTIAL" />
      <LetterRef refNo={`ANN/REL/${fir.no}`} date={caseData.letterDate} />
      <div className="ll-h1" style={{ textAlign: "center" }}>MASTER RELATIVE DETAILS — NDPS FINANCIAL INVESTIGATION</div>
      <div className="ll-h2-c">(filled by IO for tracing under Chapter V-A of the NDPS Act, 1985)</div>
      <div className="ll-formgrid">
        <div className="ll-fld"><div className="lbl">FIR No.</div><div className="val">{safe(fir.no)}</div></div>
        <div className="ll-fld"><div className="lbl">Police Station</div><div className="val">{station.name}</div></div>
        <div className="ll-fld"><div className="lbl">District</div><div className="val">{station.district}</div></div>
        <div className="ll-fld"><div className="lbl">Name of Accused</div><div className="val">{accused?.[0]?.name || ""}</div></div>
        <div className="ll-fld"><div className="lbl">Address of Accused</div><div className="val">{accused?.[0]?.address || ""}</div></div>
        <div className="ll-fld"><div className="lbl">Investigating Officer</div><div className="val">{io?.name}, {io?.rank}</div></div>
        <div className="ll-fld"><div className="lbl">Date</div><div className="val">{fmt(caseData.letterDate)}</div></div>
      </div>
      <div className="ll-h2" style={{ marginTop: 12 }}>Consolidated Relative Details Table</div>
      <table className="ll-table ll-rel-table">
        <thead>
          <tr>
            <th style={{ width: 26 }}>Sr</th>
            <th style={{ width: 130 }}>Relation</th>
            <th>Name</th>
            <th>Father / Husband</th>
            <th>Address</th>
            <th style={{ width: 60 }}>Lives with Accused</th>
            <th>Occupation</th>
            <th style={{ width: 80 }}>Income</th>
            <th>Bank(s) &amp; A/c No.</th>
            <th style={{ width: 100 }}>PAN</th>
            <th>Property in Name</th>
            <th>Financial Dealings</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {relatives?.map((r, i) => (
            <tr key={i}>
              <td className="num">{i + 1}</td>
              <td>{r.relation}</td>
              <td>{r.name}</td>
              <td>{r.fatherOrHusband}</td>
              <td className="addr">{r.address}</td>
              <td className="num">{r.livesWith ? "Y" : "—"}</td>
              <td>{r.occupation}</td>
              <td>{r.income}</td>
              <td className="addr">{r.bank}{r.account ? " · " + r.account : ""}</td>
              <td className="mono">{r.pan}</td>
              <td className="addr">{r.property}</td>
              <td className="addr">{r.financialDealings}</td>
              <td className="addr">{r.remarks}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ll-h2" style={{ marginTop: 14 }}>Quick Verification Check (IO to tick ✓ if applicable)</div>
      <ul className="ll-checklist">
        <li>☐ Large cash deposits noticed</li>
        <li>☐ Property purchased after registration of the NDPS case</li>
        <li>☐ Property beyond known sources of income</li>
        <li>☐ Frequent money transfer from accused</li>
        <li>☐ Suspected <i>benami</i> holding</li>
      </ul>
      <Signature io={io} station={station} />
    </LetterPage>
  );
}

// Master switch — pick the right component for the given letter id
window.LETTER_COMPONENTS = {
  L1: L_Banks,
  L2: L_IncomeTax,
  L3: L_TCPMunicipal,
  L4: L_Electricity,
  L5: L_RTO,
  L6: L_Tehsildar,
  L7: L_Patwari,
  L8: L_DC,
  L9: L_DLR,
  L10: L_NaibTehsildarEval,
  L11: L_IRDAI,
  L12: L_Immigration,
  L13: L_RelativesAttachment,
};
