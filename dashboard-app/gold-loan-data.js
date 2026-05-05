/* ═══════════════════════════════════════════════
   GOLD LOAN DATA — Gold Loan NBFC Dashboard
   Part 2 of 8
   NOTE: Replace hardcoded values with Excel API
         mappings when data pipeline is ready.
         See EXCEL COLUMN MAPPING comments below.
═══════════════════════════════════════════════ */

const GOLDRATE = 9240;

const HIGH_RISK_ACCOUNTS = [
  {id:'GL-00482',branch:'Kottayam',  customer:'Rajan K.',    grams:18.2,outstanding:178400,goldValue:Math.round(18.2*GOLDRATE),daysOverdue:92,status:'critical'},
  {id:'GL-01124',branch:'Trivandrum',customer:'Sreeja M.',   grams:22.4,outstanding:216800,goldValue:Math.round(22.4*GOLDRATE),daysOverdue:78,status:'critical'},
  {id:'GL-02381',branch:'Palakkad',  customer:'Muhammed A.', grams:14.6,outstanding:141200,goldValue:Math.round(14.6*GOLDRATE),daysOverdue:65,status:'critical'},
  {id:'GL-03014',branch:'Kottayam',  customer:'Latha P.',    grams:31.0,outstanding:294800,goldValue:Math.round(31.0*GOLDRATE),daysOverdue:48,status:'high'},
  {id:'GL-04456',branch:'Thrissur',  customer:'Anilkumar R.',grams:19.8,outstanding:186000,goldValue:Math.round(19.8*GOLDRATE),daysOverdue:44,status:'high'},
  {id:'GL-05621',branch:'Trivandrum',customer:'Bindhu S.',   grams:26.4,outstanding:248200,goldValue:Math.round(26.4*GOLDRATE),daysOverdue:38,status:'high'},
  {id:'GL-06874',branch:'Kozhikode', customer:'Thomas V.',   grams:12.2,outstanding:115600,goldValue:Math.round(12.2*GOLDRATE),daysOverdue:22,status:'watch'},
  {id:'GL-07102',branch:'Ernakulam', customer:'Deepa J.',    grams:38.6,outstanding:361800,goldValue:Math.round(38.6*GOLDRATE),daysOverdue:18,status:'watch'}
];

const BRANCHES = [
  {n:'Ernakulam', aum:48.2,disb:6.8,coll:99.5,npa:1.4,gw:28400},
  {n:'Thrissur',  aum:38.6,disb:5.4,coll:98.8,npa:2.1,gw:22100},
  {n:'Kozhikode', aum:34.1,disb:4.9,coll:99.2,npa:1.7,gw:19800},
  {n:'Trivandrum',aum:29.8,disb:4.2,coll:97.9,npa:2.8,gw:17200},
  {n:'Kollam',    aum:22.4,disb:3.1,coll:99.1,npa:1.9,gw:13100},
  {n:'Palakkad',  aum:18.6,disb:2.6,coll:98.5,npa:2.2,gw:10800},
  {n:'Kannur',    aum:14.1,disb:2.2,coll:99.3,npa:1.5,gw:8200},
  {n:'Kottayam',  aum:8.6, disb:1.5,coll:98.2,npa:3.1,gw:5000}
];

/*
  EXCEL COLUMN MAPPING (replace hardcoded values when Excel API is ready):
  Total AUM           ← SUM(Closing Balance)         [Loan Balance Statement]
  Total Customers     ← COUNT DISTINCT(Customer ID)   [Loan Balance Statement]
  Yield               ← AVG(Total Interest Rate)      [Loan Balance Statement]
  New Disbursement    ← SUM(Disbursed Value) WHERE Disbursement Date IN [period]
  Daily Disbursement  ← SUM(Disbursed Value) WHERE Disbursement Date = today
  Total Collection    ← SUM(Principal CR) + SUM(Total Interest Amount) [Transaction Statement]
  Overdue Collection  ← SUM(Principal CR + Interest Received) WHERE DPD > 0
  Total Gold Pledged  ← SUM(Gold Weight)
  GNPA Amount         ← SUM(Closing Balance) WHERE DPD > 90
  GNPA %              ← GNPA Amount / Total AUM
  Avg Ticket Size     ← Total AUM / COUNT(Loan Account Number)
  Bucket 0-30         ← SUM(Closing Balance) WHERE DPD BETWEEN 1 AND 30
  Bucket 31-60        ← SUM(Closing Balance) WHERE DPD BETWEEN 31 AND 60
  Bucket 61-90        ← SUM(Closing Balance) WHERE DPD BETWEEN 61 AND 90
  Bucket 90+          ← SUM(Closing Balance) WHERE DPD > 90
  Bucket %            ← Bucket Amount / Total Closing Balance
  Collection Eff.     ← SUM(collection for overdue accounts) / SUM(overdue balance)
  Branch-wise AUM     ← GROUP BY Branch Name, SUM(Closing Balance)
  High Risk           ← WHERE Loan Outstanding > (Gold Weight × GOLDRATE)
*/

const D = {

  /* ─────────────────── FTD ─────────────────── */
  FTD: {
    kpis: [
      {l:'Total AUM',           v:'214.4 Cr',   s:'↑ 0.4 vs prev day',    d:'up'},
      {l:'Total Customers',     v:'4,092',       s:'8 new today',           d:'up'},
      {l:'Yield %',             v:'18.4%',       s:'Target 18.0%',          d:'up'},
      {l:'New Disbursement',    v:'₹38.2 L',     s:'↑ 6% vs prev day',     d:'up'},
      {l:'Daily Disbursement',  v:'₹38.2 L',     s:'18 loans today',        d:''},
      {l:'Total Collection',    v:'₹29.5 L',     s:'99.1% efficiency',      d:'up'},
      {l:'Overdue Collection',  v:'₹4.1 L',      s:'14 overdue a/c',        d:'dn'},
      {l:'Total Gold Pledged',  v:'2,31,800g',   s:'Avg 18.4g/loan',        d:''},
      {l:'GNPA / NNPA',         v:'1.82/1.24%',  s:'↑0.01% GNPA',          d:'dn'},
      {l:'Avg LTV',             v:'62.4%',        s:'Gold ₹9,240/g',         d:''},
      {l:'Collection Eff.',     v:'99.1%',        s:'Target 99.5%',          d:''},
      {l:'Avg Ticket Size',     v:'₹52,400',      s:'Gold 18.4g avg',        d:''}
    ],
    dailyDisb:   {labels:['Today'], data:[38.2]},
    disbColl:    {labels:['Today'], disb:[38.2], coll:[29.5]},
    buckets: [
      {b:'0–30 Days',  amt:'4.8 Cr', pct:38, od:'4.8 Cr', trend:'↑'},
      {b:'31–60 Days', amt:'3.2 Cr', pct:25, od:'3.2 Cr', trend:''},
      {b:'61–90 Days', amt:'2.6 Cr', pct:20, od:'2.6 Cr', trend:''},
      {b:'90+ Days',   amt:'2.2 Cr', pct:17, od:'2.2 Cr', trend:'↓'}
    ],
    totalOD: '12.8',
    collOverview: [
      {l:'Total collection today', v:'₹29.5 L',   c:'up'},
      {l:'Overdue collection',     v:'₹4.1 L',    c:'dn'},
      {l:'Overdue accounts',       v:'14',         c:'dn'},
      {l:'Collection efficiency',  v:'99.1%',      c:'up'},
      {l:'New disbursement',       v:'₹38.2 L',   c:'up'},
      {l:'Total gold pledged',     v:'2,31,800g',  c:''}
    ],
    tgtBranches: [
      {n:'Ernakulam', act:2.4,tgt:2.8},{n:'Thrissur',   act:2.1,tgt:2.2},
      {n:'Kozhikode', act:1.9,tgt:2.0},{n:'Trivandrum', act:1.6,tgt:2.0},
      {n:'Kollam',    act:1.3,tgt:1.5},{n:'Palakkad',   act:1.1,tgt:1.3},
      {n:'Kannur',    act:0.9,tgt:1.0},{n:'Kottayam',   act:0.6,tgt:0.8}
    ],
    newCust: {
      total:8, walkin:5, referral:2, digital:1,
      trend: {labels:['Today'], data:[8]},
      byBranch: [
        {n:'Ernakulam', new:3,loans:3,grams:55.2},{n:'Thrissur',   new:2,loans:2,grams:38.4},
        {n:'Kozhikode', new:1,loans:1,grams:19.2},{n:'Trivandrum', new:1,loans:1,grams:17.8},
        {n:'Kollam',    new:1,loans:1,grams:16.5},{n:'Others',     new:0,loans:0,grams:0}
      ]
    },
    closure: {
      loans:18, grams:331.2, value:'₹30.6 L', avgGrams:18.4,
      trend: {labels:['Today'], grams:[331]},
      byBranch: [
        {n:'Ernakulam', grams:82},{n:'Thrissur',   grams:64},{n:'Kozhikode',  grams:54},
        {n:'Trivandrum',grams:48},{n:'Kollam',     grams:42},{n:'Others',     grams:41}
      ],
      reasons: [
        {r:'Full repayment',   pct:72},{r:'Part release',    pct:18},
        {r:'Auction settled',  pct:7}, {r:'Transfer out',    pct:3}
      ]
    }
  },

  /* ─────────────────── MTD ─────────────────── */
  MTD: {
    kpis: [
      {l:'Total AUM',          v:'214.4 Cr',   s:'↑ 3.2 vs Mar',          d:'up'},
      {l:'Total Customers',    v:'4,092',       s:'124 MTD new',            d:'up'},
      {l:'Yield %',            v:'18.4%',       s:'Target 18.0%',           d:'up'},
      {l:'New Disbursement',   v:'₹28.6 Cr',   s:'Target ₹32 Cr (89%)',    d:'dn'},
      {l:'Daily Disbursement', v:'₹1.43 Cr',   s:'Avg per working day',    d:''},
      {l:'Total Collection',   v:'₹31.2 Cr',   s:'99.3% efficiency',       d:'up'},
      {l:'Overdue Collection', v:'₹1.86 Cr',   s:'↑0.12 Cr vs prev',      d:'dn'},
      {l:'Total Gold Pledged', v:'2,31,800g',   s:'₹214 Cr pledged',        d:''},
      {l:'GNPA / NNPA',        v:'1.82/1.24%',  s:'NNPA improving',         d:''},
      {l:'Avg LTV',            v:'62.4%',        s:'Gold ₹9,240/g',          d:''},
      {l:'Collection Eff.',    v:'99.3%',        s:'Target 99.5%',           d:''},
      {l:'Loan Closures',      v:'312',          s:'↑12 vs Mar',             d:'up'}
    ],
    dailyDisb: {
      labels:['1','3','5','7','9','11','13','15','17','19','21','23','25','27','29','31'],
      data:[1.2,1.8,1.4,2.1,1.6,1.9,1.3,2.4,1.7,2.0,1.5,1.8,1.1,1.6,2.2,1.9]
    },
    disbColl: {
      labels:['Wk1','Wk2','Wk3','Wk4','Wk5','Wk6'],
      disb:[4.1,5.2,4.8,6.1,4.9,3.5], coll:[5.2,4.9,5.5,5.1,5.8,4.7]
    },
    buckets: [
      {b:'0–30 Days',  amt:'4.8 Cr',pct:38,od:'4.8 Cr',trend:'↑'},
      {b:'31–60 Days', amt:'3.2 Cr',pct:25,od:'3.2 Cr',trend:''},
      {b:'61–90 Days', amt:'2.6 Cr',pct:20,od:'2.6 Cr',trend:''},
      {b:'90+ Days',   amt:'2.2 Cr',pct:17,od:'2.2 Cr',trend:'↓'}
    ],
    totalOD: '12.8',
    collOverview: [
      {l:'MTD total collection',  v:'₹31.2 Cr',  c:'up'},
      {l:'Overdue collection',    v:'₹1.86 Cr',  c:'dn'},
      {l:'Overdue accounts',      v:'148',        c:'dn'},
      {l:'Collection efficiency', v:'99.3%',      c:'up'},
      {l:'MTD disbursement',      v:'₹28.6 Cr',  c:''},
      {l:'Total gold pledged',    v:'2,31,800g',  c:''}
    ],
    tgtBranches: [
      {n:'Ernakulam', act:6.8,tgt:7.5},{n:'Thrissur',   act:5.4,tgt:5.8},
      {n:'Kozhikode', act:4.9,tgt:5.2},{n:'Trivandrum', act:4.2,tgt:5.5},
      {n:'Kollam',    act:3.1,tgt:3.5},{n:'Palakkad',   act:2.6,tgt:3.0},
      {n:'Kannur',    act:2.2,tgt:2.4},{n:'Kottayam',   act:1.5,tgt:2.0}
    ],
    newCust: {
      total:124, walkin:68, referral:38, digital:18,
      trend: {labels:['Wk1','Wk2','Wk3','Wk4','Wk5','Wk6'], data:[18,24,21,28,19,14]},
      byBranch: [
        {n:'Ernakulam', new:32,loans:38,grams:699.2},{n:'Thrissur',   new:22,loans:26,grams:478.4},
        {n:'Kozhikode', new:18,loans:21,grams:386.4},{n:'Trivandrum', new:16,loans:18,grams:331.2},
        {n:'Kollam',    new:14,loans:16,grams:294.4},{n:'Palakkad',   new:12,loans:14,grams:257.6},
        {n:'Kannur',    new:8, loans:9, grams:165.6},{n:'Kottayam',   new:2, loans:3, grams:55.2}
      ]
    },
    closure: {
      loans:312, grams:5740.8, value:'₹5.30 Cr', avgGrams:18.4,
      trend: {labels:['Wk1','Wk2','Wk3','Wk4','Wk5','Wk6'], grams:[920,1040,960,1180,980,660]},
      byBranch: [
        {n:'Ernakulam', grams:1428},{n:'Thrissur',   grams:1142},{n:'Kozhikode',  grams:998},
        {n:'Trivandrum',grams:862}, {n:'Kollam',     grams:740}, {n:'Palakkad',   grams:312},
        {n:'Kannur',    grams:198}, {n:'Kottayam',   grams:60}
      ],
      reasons: [
        {r:'Full repayment',  pct:71},{r:'Part release',   pct:17},
        {r:'Auction settled', pct:8}, {r:'Transfer out',   pct:4}
      ]
    }
  },

  /* ─────────────────── YTD ─────────────────── */
  YTD: {
    kpis: [
      {l:'Total AUM',          v:'214.4 Cr',   s:'↑18.7% vs FY24',       d:'up'},
      {l:'Total Customers',    v:'4,092',       s:'612 vs FY24',           d:'up'},
      {l:'Yield %',            v:'18.4%',       s:'↑0.3% vs FY24',        d:'up'},
      {l:'New Disbursement',   v:'₹312.4 Cr',  s:'Target ₹340 Cr (92%)', d:'dn'},
      {l:'Daily Disbursement', v:'₹1.38 Cr',   s:'YTD avg per day',       d:''},
      {l:'Total Collection',   v:'₹298.6 Cr',  s:'98.9% efficiency',      d:'up'},
      {l:'Overdue Collection', v:'₹12.8 Cr',   s:'Total OD portfolio',    d:'dn'},
      {l:'Total Gold Pledged', v:'2,31,800g',   s:'₹214 Cr pledged',       d:''},
      {l:'GNPA / NNPA',        v:'1.82/1.24%',  s:'↑0.18% GNPA YoY',      d:'dn'},
      {l:'Avg LTV',            v:'62.4%',        s:'Gold ₹9,240/g',         d:''},
      {l:'Collection Eff.',    v:'98.9%',        s:'↑0.2% vs FY24',         d:'up'},
      {l:'Loan Closures',      v:'3,842',        s:'↑8% vs FY24',           d:'up'}
    ],
    dailyDisb: {
      labels:['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'],
      data:[22,26,24,31,28,32,29,34,30,27,31,28.6]
    },
    disbColl: {
      labels:['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'],
      disb:[22,26,24,31,28,32,29,34,30,27,31,28.6],
      coll:[20,25,23,29,27,31,28,32,29,26,30,27]
    },
    buckets: [
      {b:'0–30 Days',  amt:'4.8 Cr',pct:38,od:'4.8 Cr',trend:'↑'},
      {b:'31–60 Days', amt:'3.2 Cr',pct:25,od:'3.2 Cr',trend:''},
      {b:'61–90 Days', amt:'2.6 Cr',pct:20,od:'2.6 Cr',trend:''},
      {b:'90+ Days',   amt:'2.2 Cr',pct:17,od:'2.2 Cr',trend:'↓'}
    ],
    totalOD: '12.8',
    collOverview: [
      {l:'YTD total collection',  v:'₹298.6 Cr', c:'up'},
      {l:'Overdue collection',    v:'₹12.8 Cr',  c:'dn'},
      {l:'Overdue accounts',      v:'842',        c:'dn'},
      {l:'Collection efficiency', v:'98.9%',      c:'up'},
      {l:'YTD disbursement',      v:'₹312.4 Cr', c:''},
      {l:'Total gold pledged',    v:'2,31,800g',  c:''}
    ],
    tgtBranches: [
      {n:'Ernakulam', act:72,tgt:78},{n:'Thrissur',   act:58,tgt:62},
      {n:'Kozhikode', act:52,tgt:55},{n:'Trivandrum', act:44,tgt:58},
      {n:'Kollam',    act:34,tgt:38},{n:'Palakkad',   act:28,tgt:32},
      {n:'Kannur',    act:24,tgt:26},{n:'Kottayam',   act:16,tgt:22}
    ],
    newCust: {
      total:612, walkin:336, referral:184, digital:92,
      trend: {
        labels:['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'],
        data:[44,52,48,58,54,62,58,64,56,50,58,56]
      },
      byBranch: [
        {n:'Ernakulam', new:158,loans:182,grams:3350},{n:'Thrissur',   new:112,loans:128,grams:2355},
        {n:'Kozhikode', new:92, loans:106,grams:1950},{n:'Trivandrum', new:84, loans:96, grams:1765},
        {n:'Kollam',    new:72, loans:82, grams:1508},{n:'Palakkad',   new:58, loans:66, grams:1214},
        {n:'Kannur',    new:22, loans:26, grams:478}, {n:'Kottayam',   new:14, loans:16, grams:294}
      ]
    },
    closure: {
      loans:3842, grams:70693, value:'₹65.3 Cr', avgGrams:18.4,
      trend: {
        labels:['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'],
        grams:[5200,5800,5600,6800,6200,7200,6800,7600,7000,6400,7200,5893]
      },
      byBranch: [
        {n:'Ernakulam', grams:17600},{n:'Thrissur',   grams:14080},{n:'Kozhikode',  grams:12320},
        {n:'Trivandrum',grams:10560},{n:'Kollam',     grams:8800}, {n:'Palakkad',   grams:3840},
        {n:'Kannur',    grams:2400}, {n:'Kottayam',   grams:1093}
      ],
      reasons: [
        {r:'Full repayment',  pct:70},{r:'Part release',   pct:18},
        {r:'Auction settled', pct:8}, {r:'Transfer out',   pct:4}
      ]
    }
  }

};
