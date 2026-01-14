/**
 * LaTeX Templates Index
 * Collection of 11 templates for different document types
 */

export interface LaTeXTemplate {
  id: string
  name: string
  description: string
  category: 'academic' | 'presentation' | 'cv' | 'other'
  files: {
    name: string
    content: string
    isMain?: boolean
  }[]
  variables?: {
    name: string
    label: string
    placeholder: string
    required?: boolean
  }[]
}

// Article Template
export const articleTemplate: LaTeXTemplate = {
  id: 'article',
  name: 'Article',
  description: 'Standard LaTeX article for general documents',
  category: 'academic',
  variables: [
    { name: 'title', label: 'Title', placeholder: 'Document Title', required: true },
    { name: 'author', label: 'Author', placeholder: 'Your Name', required: true },
    { name: 'date', label: 'Date', placeholder: '\\today' },
  ],
  files: [
    {
      name: 'main.tex',
      isMain: true,
      content: `\\documentclass[12pt]{article}

\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{amsmath,amssymb,amsthm}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage[margin=1in]{geometry}

\\title{{{title}}}
\\author{{{author}}}
\\date{{{date}}}

\\begin{document}

\\maketitle

\\begin{abstract}
Your abstract goes here.
\\end{abstract}

\\section{Introduction}
Start writing your document here.

\\section{Methods}

\\section{Results}

\\section{Discussion}

\\section{Conclusion}

\\bibliographystyle{plain}
\\bibliography{references}

\\end{document}
`,
    },
    {
      name: 'references.bib',
      content: `@article{example2024,
  author = {Author, Example},
  title = {An Example Article},
  journal = {Journal of Examples},
  year = {2024},
  volume = {1},
  pages = {1-10}
}
`,
    },
  ],
}

// IEEE Template
export const ieeeTemplate: LaTeXTemplate = {
  id: 'ieee',
  name: 'IEEE Conference',
  description: 'IEEE conference paper format',
  category: 'academic',
  variables: [
    { name: 'title', label: 'Title', placeholder: 'Paper Title', required: true },
    { name: 'author', label: 'Author', placeholder: 'Your Name', required: true },
    { name: 'affiliation', label: 'Affiliation', placeholder: 'Your University' },
    { name: 'email', label: 'Email', placeholder: 'your@email.com' },
  ],
  files: [
    {
      name: 'main.tex',
      isMain: true,
      content: `\\documentclass[conference]{IEEEtran}

\\usepackage[utf8]{inputenc}
\\usepackage{amsmath,amssymb}
\\usepackage{graphicx}
\\usepackage{cite}
\\usepackage{hyperref}

\\begin{document}

\\title{{{title}}}

\\author{\\IEEEauthorblockN{{{author}}}
\\IEEEauthorblockA{{{affiliation}}\\\\
{{email}}}}

\\maketitle

\\begin{abstract}
This paper presents...
\\end{abstract}

\\begin{IEEEkeywords}
keyword1, keyword2, keyword3
\\end{IEEEkeywords}

\\section{Introduction}
\\IEEEPARstart{T}{his} paper introduces...

\\section{Related Work}

\\section{Methodology}

\\section{Experiments}

\\section{Results}

\\section{Conclusion}

\\bibliographystyle{IEEEtran}
\\bibliography{references}

\\end{document}
`,
    },
    {
      name: 'references.bib',
      content: `@inproceedings{example2024,
  author = {Author, Example},
  title = {An Example Paper},
  booktitle = {IEEE Conference on Examples},
  year = {2024},
  pages = {1-6}
}
`,
    },
  ],
}

// ACM Template
export const acmTemplate: LaTeXTemplate = {
  id: 'acm',
  name: 'ACM Conference',
  description: 'ACM conference paper format (sigconf)',
  category: 'academic',
  variables: [
    { name: 'title', label: 'Title', placeholder: 'Paper Title', required: true },
    { name: 'author', label: 'Author', placeholder: 'Your Name', required: true },
    { name: 'affiliation', label: 'Affiliation', placeholder: 'Your University' },
    { name: 'email', label: 'Email', placeholder: 'your@email.com' },
  ],
  files: [
    {
      name: 'main.tex',
      isMain: true,
      content: `\\documentclass[sigconf,review]{acmart}

\\usepackage{booktabs}

\\begin{document}

\\title{{{title}}}

\\author{{{author}}}
\\affiliation{%
  \\institution{{{affiliation}}}
}
\\email{{{email}}}

\\begin{abstract}
Your abstract here.
\\end{abstract}

\\begin{CCSXML}
<ccs2012>
<concept>
<concept_id>10010147.10010178</concept_id>
<concept_desc>Computing methodologies~Machine learning</concept_desc>
<concept_significance>500</concept_significance>
</concept>
</ccs2012>
\\end{CCSXML}

\\ccsdesc[500]{Computing methodologies~Machine learning}

\\keywords{keyword1, keyword2, keyword3}

\\maketitle

\\section{Introduction}

\\section{Related Work}

\\section{Method}

\\section{Experiments}

\\section{Conclusion}

\\bibliographystyle{ACM-Reference-Format}
\\bibliography{references}

\\end{document}
`,
    },
    {
      name: 'references.bib',
      content: `@inproceedings{example2024,
  author = {Author, Example},
  title = {An Example Paper},
  booktitle = {ACM Conference},
  year = {2024},
  doi = {10.1145/1234567.1234568}
}
`,
    },
  ],
}

// ArXiv Template
export const arxivTemplate: LaTeXTemplate = {
  id: 'arxiv',
  name: 'ArXiv Preprint',
  description: 'Clean preprint format suitable for arXiv',
  category: 'academic',
  variables: [
    { name: 'title', label: 'Title', placeholder: 'Paper Title', required: true },
    { name: 'author', label: 'Author(s)', placeholder: 'Author One, Author Two', required: true },
    { name: 'affiliation', label: 'Affiliation', placeholder: 'University Name' },
  ],
  files: [
    {
      name: 'main.tex',
      isMain: true,
      content: `\\documentclass[11pt]{article}

\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{amsmath,amssymb,amsthm}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage[margin=1in]{geometry}
\\usepackage{natbib}

\\title{{{title}}}
\\author{{{author}}\\\\
\\small {{affiliation}}}
\\date{}

\\newtheorem{theorem}{Theorem}
\\newtheorem{lemma}[theorem]{Lemma}
\\newtheorem{proposition}[theorem]{Proposition}
\\newtheorem{corollary}[theorem]{Corollary}
\\theoremstyle{definition}
\\newtheorem{definition}{Definition}
\\newtheorem{example}{Example}
\\theoremstyle{remark}
\\newtheorem{remark}{Remark}

\\begin{document}

\\maketitle

\\begin{abstract}
Your abstract goes here. Keep it under 200 words for arXiv.
\\end{abstract}

\\section{Introduction}

\\section{Background}

\\section{Method}

\\section{Experiments}

\\section{Results}

\\section{Related Work}

\\section{Conclusion}

\\section*{Acknowledgments}
We thank...

\\bibliographystyle{plainnat}
\\bibliography{references}

\\appendix
\\section{Proofs}

\\end{document}
`,
    },
    {
      name: 'references.bib',
      content: `@article{example2024,
  author = {Author, Example},
  title = {An Example Article},
  journal = {arXiv preprint arXiv:2401.00001},
  year = {2024}
}
`,
    },
  ],
}

// Thesis Template
export const thesisTemplate: LaTeXTemplate = {
  id: 'thesis',
  name: 'Thesis/Dissertation',
  description: 'Graduate thesis or dissertation template',
  category: 'academic',
  variables: [
    { name: 'title', label: 'Title', placeholder: 'Thesis Title', required: true },
    { name: 'author', label: 'Author', placeholder: 'Your Name', required: true },
    { name: 'degree', label: 'Degree', placeholder: 'Doctor of Philosophy' },
    { name: 'department', label: 'Department', placeholder: 'Computer Science' },
    { name: 'university', label: 'University', placeholder: 'University Name' },
    { name: 'year', label: 'Year', placeholder: '2024' },
  ],
  files: [
    {
      name: 'main.tex',
      isMain: true,
      content: `\\documentclass[12pt,oneside]{book}

\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{amsmath,amssymb,amsthm}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage[margin=1.25in]{geometry}
\\usepackage{setspace}
\\usepackage{fancyhdr}

\\doublespacing

\\pagestyle{fancy}
\\fancyhf{}
\\fancyhead[R]{\\thepage}
\\renewcommand{\\headrulewidth}{0pt}

\\title{{{title}}}
\\author{{{author}}}
\\date{{{year}}}

\\begin{document}

% Title Page
\\begin{titlepage}
\\centering
\\vspace*{1in}
{\\LARGE {{title}} \\par}
\\vspace{1in}
{\\large A dissertation submitted in partial fulfillment\\\\
of the requirements for the degree of\\\\[0.5em]
{{degree}}\\par}
\\vspace{1in}
{\\large {{author}}\\par}
\\vspace{0.5in}
{\\large Department of {{department}}\\\\
{{university}}\\par}
\\vspace{0.5in}
{\\large {{year}}\\par}
\\end{titlepage}

\\frontmatter
\\tableofcontents
\\listoffigures
\\listoftables

\\chapter{Abstract}
Your abstract here.

\\chapter{Acknowledgments}
I would like to thank...

\\mainmatter

\\chapter{Introduction}
\\section{Motivation}
\\section{Contributions}
\\section{Outline}

\\chapter{Background}
\\section{Related Work}

\\chapter{Method}

\\chapter{Experiments}

\\chapter{Results}

\\chapter{Conclusion}
\\section{Summary}
\\section{Future Work}

\\backmatter
\\bibliographystyle{plain}
\\bibliography{references}

\\appendix
\\chapter{Additional Results}

\\end{document}
`,
    },
    {
      name: 'references.bib',
      content: `@phdthesis{example2024,
  author = {Author, Example},
  title = {An Example Thesis},
  school = {University Name},
  year = {2024}
}
`,
    },
  ],
}

// Report Template
export const reportTemplate: LaTeXTemplate = {
  id: 'report',
  name: 'Technical Report',
  description: 'Technical report with chapters',
  category: 'academic',
  variables: [
    { name: 'title', label: 'Title', placeholder: 'Report Title', required: true },
    { name: 'author', label: 'Author', placeholder: 'Your Name', required: true },
    { name: 'organization', label: 'Organization', placeholder: 'Company/University' },
    { name: 'date', label: 'Date', placeholder: '\\today' },
  ],
  files: [
    {
      name: 'main.tex',
      isMain: true,
      content: `\\documentclass[11pt]{report}

\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{amsmath,amssymb}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage[margin=1in]{geometry}
\\usepackage{listings}
\\usepackage{xcolor}

\\lstset{
  basicstyle=\\ttfamily\\small,
  breaklines=true,
  frame=single,
  backgroundcolor=\\color{gray!10}
}

\\title{{{title}}}
\\author{{{author}}\\\\{{organization}}}
\\date{{{date}}}

\\begin{document}

\\maketitle
\\tableofcontents

\\chapter{Executive Summary}
Brief overview of the report.

\\chapter{Introduction}
\\section{Background}
\\section{Objectives}
\\section{Scope}

\\chapter{Technical Details}
\\section{Architecture}
\\section{Implementation}

\\chapter{Results}
\\section{Performance}
\\section{Analysis}

\\chapter{Conclusion}
\\section{Summary}
\\section{Recommendations}

\\appendix
\\chapter{Code Listings}
\\chapter{Data Tables}

\\bibliographystyle{plain}
\\bibliography{references}

\\end{document}
`,
    },
    {
      name: 'references.bib',
      content: `@techreport{example2024,
  author = {Author, Example},
  title = {Technical Report Example},
  institution = {Organization},
  year = {2024},
  number = {TR-2024-001}
}
`,
    },
  ],
}

// Beamer (Presentation) Template
export const beamerTemplate: LaTeXTemplate = {
  id: 'beamer',
  name: 'Presentation (Beamer)',
  description: 'Slideshow presentation using Beamer',
  category: 'presentation',
  variables: [
    { name: 'title', label: 'Title', placeholder: 'Presentation Title', required: true },
    { name: 'author', label: 'Author', placeholder: 'Your Name', required: true },
    { name: 'institute', label: 'Institute', placeholder: 'Your University' },
    { name: 'date', label: 'Date', placeholder: '\\today' },
  ],
  files: [
    {
      name: 'main.tex',
      isMain: true,
      content: `\\documentclass{beamer}

\\usetheme{Madrid}
\\usecolortheme{default}

\\usepackage[utf8]{inputenc}
\\usepackage{amsmath,amssymb}
\\usepackage{graphicx}

\\title{{{title}}}
\\author{{{author}}}
\\institute{{{institute}}}
\\date{{{date}}}

\\begin{document}

\\begin{frame}
\\titlepage
\\end{frame}

\\begin{frame}{Outline}
\\tableofcontents
\\end{frame}

\\section{Introduction}

\\begin{frame}{Introduction}
\\begin{itemize}
    \\item First point
    \\item Second point
    \\item Third point
\\end{itemize}
\\end{frame}

\\section{Main Content}

\\begin{frame}{Key Concepts}
\\begin{block}{Definition}
A key concept is...
\\end{block}

\\begin{alertblock}{Important}
Note that...
\\end{alertblock}

\\begin{exampleblock}{Example}
For instance...
\\end{exampleblock}
\\end{frame}

\\begin{frame}{Results}
\\begin{columns}
\\column{0.5\\textwidth}
Left column content

\\column{0.5\\textwidth}
Right column content
\\end{columns}
\\end{frame}

\\section{Conclusion}

\\begin{frame}{Conclusion}
\\begin{itemize}
    \\item Summary point 1
    \\item Summary point 2
    \\item Future work
\\end{itemize}
\\end{frame}

\\begin{frame}{Questions?}
\\centering
\\Large Thank you!

\\vspace{1em}
\\normalsize
Contact: {{author}}
\\end{frame}

\\end{document}
`,
    },
  ],
}

// Academic CV Template
export const cvAcademicTemplate: LaTeXTemplate = {
  id: 'cv-academic',
  name: 'Academic CV',
  description: 'Curriculum vitae for academic positions',
  category: 'cv',
  variables: [
    { name: 'name', label: 'Name', placeholder: 'Your Name', required: true },
    { name: 'title', label: 'Title', placeholder: 'Assistant Professor' },
    { name: 'department', label: 'Department', placeholder: 'Computer Science' },
    { name: 'university', label: 'University', placeholder: 'University Name' },
    { name: 'email', label: 'Email', placeholder: 'your@email.edu' },
    { name: 'phone', label: 'Phone', placeholder: '+1 (555) 123-4567' },
    { name: 'website', label: 'Website', placeholder: 'https://yoursite.edu' },
  ],
  files: [
    {
      name: 'main.tex',
      isMain: true,
      content: `\\documentclass[11pt]{article}

\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[margin=1in]{geometry}
\\usepackage{hyperref}
\\usepackage{titlesec}
\\usepackage{enumitem}

\\titleformat{\\section}{\\large\\bfseries}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{1em}{0.5em}

\\setlist[itemize]{leftmargin=*,nosep}

\\pagestyle{empty}

\\begin{document}

\\begin{center}
{\\LARGE\\bfseries {{name}}}\\\\[0.5em]
{{title}}\\\\
Department of {{department}}, {{university}}\\\\[0.5em]
\\href{mailto:{{email}}}{{{email}}} $\\cdot$ {{phone}} $\\cdot$ \\href{{{website}}}{{{website}}}
\\end{center}

\\section{Education}
\\textbf{Ph.D. in Computer Science} \\hfill 2020\\\\
University Name, City, Country

\\textbf{M.S. in Computer Science} \\hfill 2016\\\\
University Name, City, Country

\\textbf{B.S. in Computer Science} \\hfill 2014\\\\
University Name, City, Country

\\section{Academic Positions}
\\textbf{Assistant Professor} \\hfill 2020--Present\\\\
Department of {{department}}, {{university}}

\\textbf{Postdoctoral Researcher} \\hfill 2018--2020\\\\
Research Lab, University Name

\\section{Research Interests}
Machine learning, natural language processing, computer vision

\\section{Publications}

\\subsection*{Journal Articles}
\\begin{itemize}
\\item Author, A., \\textbf{Your Name}, \\& Author, B. (2024). Paper title. \\textit{Journal Name}, 1(1), 1--10.
\\end{itemize}

\\subsection*{Conference Papers}
\\begin{itemize}
\\item \\textbf{Your Name} \\& Author, A. (2023). Paper title. In \\textit{Conference Name} (pp. 1--10).
\\end{itemize}

\\section{Grants and Awards}
\\begin{itemize}
\\item NSF CAREER Award, 2023
\\item Best Paper Award, Conference Name, 2022
\\end{itemize}

\\section{Teaching}
\\begin{itemize}
\\item CS 101: Introduction to Computer Science (Fall 2023)
\\item CS 201: Data Structures (Spring 2024)
\\end{itemize}

\\section{Service}
\\begin{itemize}
\\item Program Committee: Conference Name (2023, 2024)
\\item Reviewer: Journal Name
\\end{itemize}

\\end{document}
`,
    },
  ],
}

// Modern CV Template
export const cvModernTemplate: LaTeXTemplate = {
  id: 'cv-modern',
  name: 'Modern CV',
  description: 'Clean, modern resume for industry',
  category: 'cv',
  variables: [
    { name: 'name', label: 'Name', placeholder: 'Your Name', required: true },
    { name: 'title', label: 'Title', placeholder: 'Software Engineer' },
    { name: 'email', label: 'Email', placeholder: 'your@email.com', required: true },
    { name: 'phone', label: 'Phone', placeholder: '+1 (555) 123-4567' },
    { name: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/yourname' },
    { name: 'github', label: 'GitHub', placeholder: 'github.com/yourname' },
  ],
  files: [
    {
      name: 'main.tex',
      isMain: true,
      content: `\\documentclass[11pt]{article}

\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{hyperref}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage{xcolor}

\\definecolor{primary}{RGB}{0,102,204}

\\titleformat{\\section}{\\large\\bfseries\\color{primary}}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{0.8em}{0.4em}

\\setlist[itemize]{leftmargin=*,nosep,topsep=0.2em}

\\pagestyle{empty}
\\setlength{\\parindent}{0pt}

\\begin{document}

\\begin{center}
{\\Huge\\bfseries {{name}}}\\\\[0.3em]
{\\large {{title}}}\\\\[0.5em]
{{email}} $\\cdot$ {{phone}}\\\\
\\href{https://{{linkedin}}}{{{linkedin}}} $\\cdot$ \\href{https://{{github}}}{{{github}}}
\\end{center}

\\section{Summary}
Experienced software engineer with expertise in building scalable applications.
Strong background in machine learning and distributed systems.

\\section{Experience}

\\textbf{Senior Software Engineer} \\hfill Jan 2022 -- Present\\\\
\\textit{Company Name, City}
\\begin{itemize}
\\item Led development of microservices architecture serving 1M+ users
\\item Reduced latency by 40\\% through optimization of database queries
\\item Mentored team of 5 junior engineers
\\end{itemize}

\\textbf{Software Engineer} \\hfill Jun 2019 -- Dec 2021\\\\
\\textit{Previous Company, City}
\\begin{itemize}
\\item Developed ML pipeline for real-time fraud detection
\\item Implemented CI/CD workflows reducing deployment time by 60\\%
\\end{itemize}

\\section{Education}

\\textbf{M.S. Computer Science} \\hfill 2019\\\\
University Name

\\textbf{B.S. Computer Science} \\hfill 2017\\\\
University Name, \\textit{summa cum laude}

\\section{Skills}

\\textbf{Languages:} Python, TypeScript, Go, Rust, SQL\\\\
\\textbf{Technologies:} AWS, Kubernetes, Docker, PostgreSQL, Redis\\\\
\\textbf{ML/AI:} PyTorch, TensorFlow, scikit-learn, Transformers

\\section{Projects}

\\textbf{Open Source Contribution} -- Contributed to major open-source project with 10k+ stars.

\\textbf{Personal Project} -- Built and deployed application with 50k monthly active users.

\\end{document}
`,
    },
  ],
}

// Letter Template
export const letterTemplate: LaTeXTemplate = {
  id: 'letter',
  name: 'Formal Letter',
  description: 'Professional letter format',
  category: 'other',
  variables: [
    { name: 'sender_name', label: 'Your Name', placeholder: 'Your Name', required: true },
    { name: 'sender_address', label: 'Your Address', placeholder: '123 Main St, City' },
    { name: 'recipient_name', label: 'Recipient Name', placeholder: 'Recipient Name', required: true },
    { name: 'recipient_title', label: 'Recipient Title', placeholder: 'Hiring Manager' },
    { name: 'recipient_company', label: 'Company', placeholder: 'Company Name' },
    { name: 'recipient_address', label: 'Recipient Address', placeholder: '456 Corporate Ave' },
    { name: 'subject', label: 'Subject', placeholder: 'Application for Position' },
  ],
  files: [
    {
      name: 'main.tex',
      isMain: true,
      content: `\\documentclass[11pt]{letter}

\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[margin=1in]{geometry}
\\usepackage{hyperref}

\\signature{{{sender_name}}}
\\address{{{sender_address}}}

\\begin{document}

\\begin{letter}{{{recipient_name}}\\\\
{{recipient_title}}\\\\
{{recipient_company}}\\\\
{{recipient_address}}}

\\opening{Dear {{recipient_name}},}

\\textbf{Re: {{subject}}}

I am writing to express my interest in...

[First paragraph: State the purpose of your letter]

[Second paragraph: Provide supporting details]

[Third paragraph: Call to action or next steps]

Thank you for your time and consideration. I look forward to hearing from you.

\\closing{Sincerely,}

\\end{letter}

\\end{document}
`,
    },
  ],
}

// Poster Template
export const posterTemplate: LaTeXTemplate = {
  id: 'poster',
  name: 'Academic Poster',
  description: 'Conference poster (A0 size)',
  category: 'presentation',
  variables: [
    { name: 'title', label: 'Title', placeholder: 'Poster Title', required: true },
    { name: 'author', label: 'Author(s)', placeholder: 'Author One, Author Two', required: true },
    { name: 'affiliation', label: 'Affiliation', placeholder: 'University Name' },
    { name: 'email', label: 'Contact Email', placeholder: 'your@email.com' },
  ],
  files: [
    {
      name: 'main.tex',
      isMain: true,
      content: `\\documentclass[a0paper,portrait]{tikzposter}

\\usepackage[utf8]{inputenc}
\\usepackage{amsmath,amssymb}
\\usepackage{graphicx}

\\usetheme{Default}
\\usecolorstyle{Default}

\\title{{{title}}}
\\author{{{author}}}
\\institute{{{affiliation}} \\\\ {{email}}}

\\begin{document}

\\maketitle

\\begin{columns}
\\column{0.5}

\\block{Introduction}{
Background and motivation for your research.

\\begin{itemize}
\\item Key point 1
\\item Key point 2
\\item Key point 3
\\end{itemize}
}

\\block{Methods}{
Description of your methodology.

\\begin{tikzfigure}[Method overview]
% Include figure here
\\end{tikzfigure}
}

\\block{Results}{
Main findings of your research.

\\begin{itemize}
\\item Result 1: description
\\item Result 2: description
\\item Result 3: description
\\end{itemize}
}

\\column{0.5}

\\block{Key Findings}{
\\innerblock{Finding 1}{
Description of major finding.
}

\\innerblock{Finding 2}{
Description of another finding.
}
}

\\block{Discussion}{
Interpretation of results and their significance.
}

\\block{Conclusion}{
\\begin{itemize}
\\item Summary point 1
\\item Summary point 2
\\item Future directions
\\end{itemize}
}

\\block{References}{
\\small
[1] Author et al. (2024). Paper title. \\textit{Journal}.

[2] Author et al. (2023). Paper title. \\textit{Conference}.
}

\\block{Acknowledgments}{
\\small
This work was supported by...
}

\\end{columns}

\\end{document}
`,
    },
  ],
}

// Export all templates
export const ALL_TEMPLATES: LaTeXTemplate[] = [
  articleTemplate,
  ieeeTemplate,
  acmTemplate,
  arxivTemplate,
  thesisTemplate,
  reportTemplate,
  beamerTemplate,
  cvAcademicTemplate,
  cvModernTemplate,
  letterTemplate,
  posterTemplate,
]

// Get template by ID
export function getTemplateById(id: string): LaTeXTemplate | undefined {
  return ALL_TEMPLATES.find(t => t.id === id)
}

// Get templates by category
export function getTemplatesByCategory(category: LaTeXTemplate['category']): LaTeXTemplate[] {
  return ALL_TEMPLATES.filter(t => t.category === category)
}
