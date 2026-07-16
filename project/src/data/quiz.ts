export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: 'Muungano wa Tanganyika na Zanzibar ulifanyika lini?',
    options: ['26 Aprili 1964', '9 Desemba 1961', '12 Januari 1964', '7 Aprili 1965'],
    correctIndex: 0,
    explanation: 'Muungano wa Tanganyika na Zanzibar ulifanyika tarehe 26 Aprili 1964 na kuzaliwa Jamhuri ya Muungano wa Tanzania.',
  },
  {
    id: 2,
    question: 'Makamu wa kwanza wa Rais wa Tanzania alikuwa nani?',
    options: ['Rashid Kawawa', 'Ali Hassan Mwinyi', 'Aboud Jumbe', 'Omar Ali Juma'],
    correctIndex: 0,
    explanation: 'Rashid Kawawa alikuwa Makamu wa kwanza wa Rais wa Tanzania baada ya muungano.',
  },
  {
    id: 3,
    question: 'Bendera ya Tanzania ina rangi zipi?',
    options: [
      'Kijani, njano, nyeusi na bluu',
      'Nyekundu, nyeusi na kijani',
      'Bluu, nyeupe na kijani',
      'Njano, nyeusi na nyekundu',
    ],
    correctIndex: 0,
    explanation: 'Bendera ya Tanzania ina rangi nne: kijani, njano, nyeusi na bluu zilizopangwa kwa mstari wa kijani na kijani-njano.',
  },
  {
    id: 4,
    question: 'Mji mkuu wa Tanzania ni upi?',
    options: ['Dar es Salaam', 'Dodoma', 'Arusha', 'Mwanza'],
    correctIndex: 1,
    explanation: 'Dodoma ndio mji mkuu wa kisiasa wa Tanzania tangu mwaka 1996, huku Dar es Salaam ukiwa mji mkuu wa kiuchumi.',
  },
  {
    id: 5,
    question: 'Rais wa kwanza wa Tanzania alikuwa nani?',
    options: ['Ali Hassan Mwinyi', 'Julius K. Nyerere', 'Benjamin Mkapa', 'Jakaya Kikwete'],
    correctIndex: 1,
    explanation: 'Mwalimu Julius Kambarage Nyerere alikuwa Rais wa kwanza wa Tanzania kutoka 1962 hadi 1985.',
  },
  {
    id: 6,
    question: 'Tanzania ina mikoa mingapi kwa sasa?',
    options: ['30', '25', '31', '20'],
    correctIndex: 2,
    explanation: 'Tanzania ina mikoa 31 ikiwa ni pamoja na mkoa wa Jiji la Dar es Salaam na mkoa wa Mjini Magharibi Zanzibar.',
  },
  {
    id: 7,
    question: 'Msemaji wa kwanza wa Bunge la Muungano alikuwa nani?',
    options: ['Adam Ngwilimi', 'Job Lusinde', 'Pius Msekwa', 'Samuel Sitta'],
    correctIndex: 2,
    explanation: 'Pius Msekwa alikuwa msemaji wa kwanza wa Bunge la Muungano wa Tanzania.',
  },
  {
    id: 8,
    question: 'Falsafa ya Ujamaa na Kujitegemea ilitungwa na nani?',
    options: ['Rashid Kawawa', 'Julius K. Nyerere', 'Oscar Kambona', 'Aboud Jumbe'],
    correctIndex: 1,
    explanation: 'Falsafa ya Ujamaa na Kujitegemea ilitungwa na Mwalimu Julius K. Nyerere mwaka 1967 kupitia Azimio la Arusha.',
  },
  {
    id: 9,
    question: 'Nchi jirani za Tanzania ni zipi kati ya zifuatazo?',
    options: [
      'Kenya, Uganda, Rwanda, Burundi, DRC, Zambia, Malawi, Msumbiji',
      'Kenya, Uganda, Somalia, Ethiopia',
      'Zambia, Zimbabwe, Afrika Kusini, Namibia',
      'Rwanda, Burundi, Chad, Sudan',
    ],
    correctIndex: 0,
    explanation: 'Tanzania inapakana na Kenya, Uganda, Rwanda, Burundi, DRC, Zambia, Malawi, na Msumbiji.',
  },
  {
    id: 10,
    question: 'Mlima mrefu zaidi nchini Tanzania ni upi?',
    options: ['Mlima Meru', 'Mlima Kilimanjaro', 'Mlima Rungwe', 'Mlima Hanang'],
    correctIndex: 1,
    explanation: 'Mlima Kilimanjaro ndio mlima mrefu zaidi nchini Tanzania na barani Afrika, urefu wa mita 5,895.',
  },
];
