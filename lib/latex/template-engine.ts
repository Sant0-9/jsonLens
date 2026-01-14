/**
 * LaTeX Template Engine
 *
 * Manages LaTeX project templates with variable substitution.
 */

export interface TemplateVariable {
  name: string
  label: string
  default: string
  required?: boolean
  placeholder?: string
}

export interface LatexTemplate {
  id: string
  name: string
  description: string
  category: TemplateCategory
  variables: TemplateVariable[]
  files: TemplateFile[]
  mainFile: string
  preview?: string
}

export interface TemplateFile {
  name: string
  content: string
  type: 'tex' | 'bib' | 'cls' | 'sty' | 'other'
}

export type TemplateCategory =
  | 'article'
  | 'thesis'
  | 'presentation'
  | 'cv'
  | 'letter'
  | 'poster'
  | 'other'

/**
 * Built-in templates
 */
export const TEMPLATES: LatexTemplate[] = [
  // Basic Article
  {
    id: 'article-basic',
    name: 'Basic Article',
    description: 'Simple article with sections and math support',
    category: 'article',
    variables: [
      { name: 'title', label: 'Title', default: 'My Article', required: true },
      { name: 'author', label: 'Author', default: 'Author Name', required: true },
      { name: 'date', label: 'Date', default: '\\today', placeholder: 'e.g., January 2024' }
    ],
    mainFile: 'main.tex',
    files: [
      {
        name: 'main.tex',
        type: 'tex',
        content: `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath, amssymb, amsthm}
\\usepackage{graphicx}
\\usepackage{hyperref}

\\title{{{title}}}
\\author{{{author}}}
\\date{{{date}}}

\\begin{document}

\\maketitle

\\begin{abstract}
Your abstract here.
\\end{abstract}

\\section{Introduction}
Your introduction here.

\\section{Methods}
Your methods here.

\\section{Results}
Your results here.

\\section{Conclusion}
Your conclusion here.

\\bibliographystyle{plain}
\\bibliography{references}

\\end{document}
`
      },
      {
        name: 'references.bib',
        type: 'bib',
        content: `% Bibliography file
@article{example2024,
  author = {Author, A.},
  title = {Example Article},
  journal = {Journal Name},
  year = {2024},
  volume = {1},
  pages = {1-10}
}
`
      }
    ]
  },

  // IEEE Conference
  {
    id: 'ieee-conference',
    name: 'IEEE Conference',
    description: 'IEEE conference paper format',
    category: 'article',
    variables: [
      { name: 'title', label: 'Title', default: 'Paper Title', required: true },
      { name: 'author', label: 'Authors', default: 'First Author, Second Author', required: true },
      { name: 'affiliation', label: 'Affiliation', default: 'University Name' }
    ],
    mainFile: 'main.tex',
    files: [
      {
        name: 'main.tex',
        type: 'tex',
        content: `\\documentclass[conference]{IEEEtran}
\\usepackage{cite}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{algorithmic}
\\usepackage{graphicx}
\\usepackage{textcomp}
\\usepackage{xcolor}

\\begin{document}

\\title{{{title}}}

\\author{\\IEEEauthorblockN{{{author}}}
\\IEEEauthorblockA{{{affiliation}}}}

\\maketitle

\\begin{abstract}
This paper presents...
\\end{abstract}

\\begin{IEEEkeywords}
keyword1, keyword2, keyword3
\\end{IEEEkeywords}

\\section{Introduction}
Introduction text.

\\section{Related Work}
Related work text.

\\section{Methodology}
Methodology text.

\\section{Results}
Results text.

\\section{Conclusion}
Conclusion text.

\\bibliographystyle{IEEEtran}
\\bibliography{references}

\\end{document}
`
      },
      {
        name: 'references.bib',
        type: 'bib',
        content: `@article{example,
  author = {Author Name},
  title = {Article Title},
  journal = {IEEE Trans.},
  year = {2024}
}
`
      }
    ]
  },

  // ArXiv Preprint
  {
    id: 'arxiv-preprint',
    name: 'arXiv Preprint',
    description: 'arXiv-style preprint format',
    category: 'article',
    variables: [
      { name: 'title', label: 'Title', default: 'Paper Title', required: true },
      { name: 'authors', label: 'Authors', default: 'Author One, Author Two', required: true },
      { name: 'affiliations', label: 'Affiliations', default: 'University' }
    ],
    mainFile: 'main.tex',
    files: [
      {
        name: 'main.tex',
        type: 'tex',
        content: `\\documentclass[11pt]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage{amsmath,amssymb}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{natbib}

\\title{{{title}}}
\\author{{{authors}}\\\\
\\small {{affiliations}}}
\\date{}

\\begin{document}

\\maketitle

\\begin{abstract}
Abstract text goes here.
\\end{abstract}

\\section{Introduction}

\\section{Background}

\\section{Method}

\\section{Experiments}

\\section{Results}

\\section{Conclusion}

\\bibliographystyle{plainnat}
\\bibliography{references}

\\end{document}
`
      }
    ]
  },

  // PhD Thesis
  {
    id: 'thesis-phd',
    name: 'PhD Thesis',
    description: 'Multi-chapter thesis template',
    category: 'thesis',
    variables: [
      { name: 'title', label: 'Thesis Title', default: 'Thesis Title', required: true },
      { name: 'author', label: 'Author', default: 'Your Name', required: true },
      { name: 'degree', label: 'Degree', default: 'Doctor of Philosophy' },
      { name: 'department', label: 'Department', default: 'Department of Computer Science' },
      { name: 'university', label: 'University', default: 'University Name' },
      { name: 'year', label: 'Year', default: '2024' }
    ],
    mainFile: 'main.tex',
    files: [
      {
        name: 'main.tex',
        type: 'tex',
        content: `\\documentclass[12pt,a4paper]{report}
\\usepackage[margin=1in]{geometry}
\\usepackage{amsmath,amssymb}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{setspace}

\\doublespacing

\\title{{\\LARGE \\bf {{title}}}}
\\author{{{author}}}
\\date{{{year}}}

\\begin{document}

% Title Page
\\begin{titlepage}
\\centering
\\vspace*{2cm}
{\\LARGE\\bfseries {{title}} \\par}
\\vspace{2cm}
{\\Large {{author}} \\par}
\\vspace{1cm}
{\\large A dissertation submitted in partial fulfillment\\\\
of the requirements for the degree of\\\\
{{degree}} \\par}
\\vspace{1cm}
{\\large {{department}}\\\\
{{university}} \\par}
\\vspace{1cm}
{\\large {{year}} \\par}
\\end{titlepage}

\\tableofcontents

\\chapter{Introduction}
\\input{chapters/introduction}

\\chapter{Literature Review}
\\input{chapters/literature}

\\chapter{Methodology}
\\input{chapters/methodology}

\\chapter{Results}
\\input{chapters/results}

\\chapter{Conclusion}
\\input{chapters/conclusion}

\\bibliographystyle{plain}
\\bibliography{references}

\\end{document}
`
      },
      {
        name: 'chapters/introduction.tex',
        type: 'tex',
        content: `% Introduction chapter
Your introduction text here.

\\section{Background}
Background information.

\\section{Research Questions}
Your research questions.

\\section{Contributions}
Your contributions.
`
      },
      {
        name: 'chapters/literature.tex',
        type: 'tex',
        content: `% Literature review
Your literature review here.
`
      },
      {
        name: 'chapters/methodology.tex',
        type: 'tex',
        content: `% Methodology chapter
Your methodology here.
`
      },
      {
        name: 'chapters/results.tex',
        type: 'tex',
        content: `% Results chapter
Your results here.
`
      },
      {
        name: 'chapters/conclusion.tex',
        type: 'tex',
        content: `% Conclusion chapter
Your conclusions here.
`
      },
      {
        name: 'references.bib',
        type: 'bib',
        content: `% References
@book{example,
  author = {Author Name},
  title = {Book Title},
  publisher = {Publisher},
  year = {2024}
}
`
      }
    ]
  },

  // Beamer Presentation
  {
    id: 'beamer-presentation',
    name: 'Beamer Slides',
    description: 'Presentation slides with Beamer',
    category: 'presentation',
    variables: [
      { name: 'title', label: 'Title', default: 'Presentation Title', required: true },
      { name: 'author', label: 'Author', default: 'Author Name', required: true },
      { name: 'institution', label: 'Institution', default: 'University' },
      { name: 'date', label: 'Date', default: '\\today' }
    ],
    mainFile: 'main.tex',
    files: [
      {
        name: 'main.tex',
        type: 'tex',
        content: `\\documentclass{beamer}
\\usetheme{Madrid}
\\usecolortheme{default}

\\title{{{title}}}
\\author{{{author}}}
\\institute{{{institution}}}
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

\\begin{frame}{Main Content}
Your main content here.
\\end{frame}

\\begin{frame}{Results}
\\begin{figure}
  % \\includegraphics[width=0.8\\textwidth]{figure}
  \\caption{Your figure caption}
\\end{figure}
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
\\end{frame}

\\end{document}
`
      }
    ]
  },

  // Academic CV
  {
    id: 'cv-academic',
    name: 'Academic CV',
    description: 'Professional academic curriculum vitae',
    category: 'cv',
    variables: [
      { name: 'fullName', label: 'Full Name', default: 'Your Name', required: true },
      { name: 'email', label: 'Email', default: 'email@university.edu', required: true },
      { name: 'phone', label: 'Phone', default: '+1 (555) 123-4567' },
      { name: 'address', label: 'Address', default: 'Department, University' },
      { name: 'website', label: 'Website', default: 'https://yourwebsite.com' }
    ],
    mainFile: 'main.tex',
    files: [
      {
        name: 'main.tex',
        type: 'tex',
        content: `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{titlesec}

\\titleformat{\\section}{\\large\\bfseries}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{12pt}{6pt}

\\pagestyle{empty}

\\begin{document}

\\begin{center}
{\\LARGE\\bfseries {{fullName}}}\\\\[6pt]
{{address}}\\\\
{{email}} | {{phone}}\\\\
\\url{{{website}}}
\\end{center}

\\section{Education}
\\textbf{PhD in Computer Science} \\hfill 2020 -- Present\\\\
University Name\\\\[6pt]
\\textbf{MS in Computer Science} \\hfill 2018 -- 2020\\\\
University Name\\\\[6pt]
\\textbf{BS in Computer Science} \\hfill 2014 -- 2018\\\\
University Name

\\section{Research Experience}
\\textbf{Graduate Research Assistant} \\hfill 2020 -- Present\\\\
Lab Name, University\\\\
Description of research.

\\section{Publications}
\\begin{enumerate}[leftmargin=*]
  \\item Author Name. \`\`Paper Title.'' \\textit{Conference/Journal}, 2024.
\\end{enumerate}

\\section{Teaching Experience}
\\textbf{Teaching Assistant} \\hfill Fall 2023\\\\
Course Name, University

\\section{Awards}
\\textbf{Fellowship Name} \\hfill 2023\\\\
Description.

\\section{Skills}
\\textbf{Programming:} Python, Java, C++\\\\
\\textbf{Tools:} Git, LaTeX, MATLAB\\\\
\\textbf{Languages:} English (native), Spanish (intermediate)

\\end{document}
`
      }
    ]
  },

  // Modern CV
  {
    id: 'cv-modern',
    name: 'Modern CV',
    description: 'Clean modern curriculum vitae',
    category: 'cv',
    variables: [
      { name: 'name', label: 'Full Name', default: 'Your Name', required: true },
      { name: 'title', label: 'Title', default: 'Software Engineer' },
      { name: 'email', label: 'Email', default: 'email@example.com', required: true },
      { name: 'phone', label: 'Phone', default: '+1 (555) 123-4567' },
      { name: 'location', label: 'Location', default: 'City, Country' }
    ],
    mainFile: 'main.tex',
    files: [
      {
        name: 'main.tex',
        type: 'tex',
        content: `\\documentclass[11pt]{article}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{xcolor}

\\definecolor{accent}{RGB}{0, 102, 204}

\\pagestyle{empty}
\\setlength{\\parindent}{0pt}

\\begin{document}

{\\Huge\\bfseries {{name}}}\\\\[4pt]
{\\large\\color{gray} {{title}}}

\\vspace{12pt}
{{email}} | {{phone}} | {{location}}

\\vspace{16pt}
\\textcolor{accent}{\\rule{\\textwidth}{1pt}}

\\vspace{12pt}
{\\large\\bfseries\\textcolor{accent}{Experience}}
\\vspace{6pt}

\\textbf{Job Title} | Company Name \\hfill 2022 -- Present
\\begin{itemize}[leftmargin=*, noitemsep]
  \\item Achievement or responsibility
  \\item Achievement or responsibility
\\end{itemize}

\\vspace{12pt}
{\\large\\bfseries\\textcolor{accent}{Education}}
\\vspace{6pt}

\\textbf{Degree Name} | University Name \\hfill 2018 -- 2022

\\vspace{12pt}
{\\large\\bfseries\\textcolor{accent}{Skills}}
\\vspace{6pt}

\\textbf{Technical:} Python, JavaScript, React\\\\
\\textbf{Tools:} Git, Docker, AWS

\\end{document}
`
      }
    ]
  },

  // Formal Letter
  {
    id: 'letter-formal',
    name: 'Formal Letter',
    description: 'Professional business letter',
    category: 'letter',
    variables: [
      { name: 'sender_name', label: 'Your Name', default: 'Your Name', required: true },
      { name: 'sender_address', label: 'Your Address', default: '123 Main St, City' },
      { name: 'recipient_name', label: 'Recipient Name', default: 'Recipient Name', required: true },
      { name: 'recipient_address', label: 'Recipient Address', default: '456 Oak Ave, City' },
      { name: 'subject', label: 'Subject', default: 'Letter Subject' }
    ],
    mainFile: 'main.tex',
    files: [
      {
        name: 'main.tex',
        type: 'tex',
        content: `\\documentclass[12pt]{letter}
\\usepackage[margin=1in]{geometry}

\\signature{{{sender_name}}}
\\address{{{sender_address}}}

\\begin{document}

\\begin{letter}{{{recipient_name}}\\\\{{recipient_address}}}

\\opening{Dear {{recipient_name}},}

\\textbf{Re: {{subject}}}

I am writing to...

Your letter content here. This is a formal letter template that you can customize for your needs.

Second paragraph of your letter.

\\closing{Sincerely,}

\\end{letter}

\\end{document}
`
      }
    ]
  },

  // Conference Poster
  {
    id: 'poster-conference',
    name: 'Conference Poster',
    description: 'Academic conference poster (A0)',
    category: 'poster',
    variables: [
      { name: 'title', label: 'Title', default: 'Poster Title', required: true },
      { name: 'authors', label: 'Authors', default: 'Author One, Author Two', required: true },
      { name: 'institution', label: 'Institution', default: 'University Name' },
      { name: 'email', label: 'Contact Email', default: 'email@university.edu' }
    ],
    mainFile: 'main.tex',
    files: [
      {
        name: 'main.tex',
        type: 'tex',
        content: `\\documentclass[a0paper,portrait]{baposter}
\\usepackage{graphicx}
\\usepackage{amsmath}

\\begin{document}

\\begin{poster}
{
  headerborder=closed,
  colspacing=1em,
  bgColorOne=white,
  bgColorTwo=white,
  borderColor=blue,
  headerColorOne=blue,
  headerColorTwo=blue,
  headerFontColor=white,
  boxColorOne=white,
  textborder=rounded,
  eyecatcher=false,
  headerheight=0.1\\textheight,
  headershape=rounded,
  headershade=plain,
  headerfont=\\Large\\bf,
  boxshade=plain,
  background=plain,
  linewidth=1pt
}
{}
{\\bf\\LARGE {{title}}}
{{{authors}}\\\\{{institution}}\\\\{{email}}}
{}

\\headerbox{Introduction}{name=introduction,column=0,row=0}{
  Introduction text here.
}

\\headerbox{Methods}{name=methods,column=0,below=introduction}{
  Methods text here.
}

\\headerbox{Results}{name=results,column=1,row=0}{
  Results text here.
}

\\headerbox{Conclusions}{name=conclusions,column=1,below=results}{
  Conclusions text here.
}

\\headerbox{References}{name=references,column=1,below=conclusions}{
  References here.
}

\\end{poster}

\\end{document}
`
      }
    ]
  },

  // Technical Report
  {
    id: 'report-technical',
    name: 'Technical Report',
    description: 'Detailed technical report',
    category: 'other',
    variables: [
      { name: 'title', label: 'Title', default: 'Technical Report Title', required: true },
      { name: 'author', label: 'Author', default: 'Author Name', required: true },
      { name: 'institution', label: 'Institution', default: 'Organization Name' },
      { name: 'report_number', label: 'Report Number', default: 'TR-2024-001' },
      { name: 'date', label: 'Date', default: '\\today' }
    ],
    mainFile: 'main.tex',
    files: [
      {
        name: 'main.tex',
        type: 'tex',
        content: `\\documentclass[11pt]{report}
\\usepackage[margin=1in]{geometry}
\\usepackage{graphicx}
\\usepackage{amsmath}
\\usepackage{hyperref}
\\usepackage{listings}
\\usepackage{xcolor}

\\lstset{
  basicstyle=\\ttfamily\\small,
  breaklines=true,
  frame=single,
  backgroundcolor=\\color{gray!10}
}

\\title{{{title}}\\\\[12pt]
\\large Technical Report {{report_number}}}
\\author{{{author}}\\\\{{institution}}}
\\date{{{date}}}

\\begin{document}

\\maketitle

\\begin{abstract}
Executive summary of the report.
\\end{abstract}

\\tableofcontents

\\chapter{Introduction}
Background and objectives.

\\chapter{Technical Approach}
Detailed technical description.

\\section{Architecture}
System architecture description.

\\section{Implementation}
Implementation details.

\\chapter{Results}
Results and findings.

\\chapter{Conclusion}
Conclusions and recommendations.

\\appendix
\\chapter{Additional Data}
Supporting information.

\\bibliographystyle{plain}
\\bibliography{references}

\\end{document}
`
      },
      {
        name: 'references.bib',
        type: 'bib',
        content: `@techreport{example,
  author = {Author Name},
  title = {Report Title},
  institution = {Organization},
  year = {2024}
}
`
      }
    ]
  },

  // Homework/Assignment
  {
    id: 'homework',
    name: 'Homework',
    description: 'Homework or assignment template',
    category: 'other',
    variables: [
      { name: 'course', label: 'Course', default: 'CS 101', required: true },
      { name: 'assignment', label: 'Assignment', default: 'Homework 1', required: true },
      { name: 'student_name', label: 'Your Name', default: 'Student Name', required: true },
      { name: 'student_id', label: 'Student ID', default: '12345' }
    ],
    mainFile: 'main.tex',
    files: [
      {
        name: 'main.tex',
        type: 'tex',
        content: `\\documentclass[11pt]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage{amsmath,amssymb}
\\usepackage{fancyhdr}

\\pagestyle{fancy}
\\fancyhf{}
\\lhead{{{course}}}
\\chead{{{assignment}}}
\\rhead{{{student_name}}}
\\cfoot{\\thepage}

\\title{{{course}} - {{assignment}}}
\\author{{{student_name}} \\\\ Student ID: {{student_id}}}
\\date{\\today}

\\begin{document}

\\maketitle

\\section*{Problem 1}
\\textbf{Question:} Problem statement here.

\\textbf{Solution:}
Your solution here.

\\section*{Problem 2}
\\textbf{Question:} Problem statement here.

\\textbf{Solution:}
Your solution here.

\\section*{Problem 3}
\\textbf{Question:} Problem statement here.

\\textbf{Solution:}
Your solution here.

\\end{document}
`
      }
    ]
  }
]

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: TemplateCategory): LatexTemplate[] {
  return TEMPLATES.filter(t => t.category === category)
}

/**
 * Get all categories with counts
 */
export function getCategories(): Array<{ category: TemplateCategory; count: number }> {
  const categories = new Map<TemplateCategory, number>()

  for (const template of TEMPLATES) {
    const count = categories.get(template.category) || 0
    categories.set(template.category, count + 1)
  }

  return Array.from(categories.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Apply variable substitutions to template content
 */
export function applyVariables(
  content: string,
  variables: Record<string, string>
): string {
  let result = content

  for (const [name, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{${name}\\}\\}`, 'g')
    result = result.replace(pattern, value)
  }

  return result
}

/**
 * Create project files from template
 */
export function createFilesFromTemplate(
  template: LatexTemplate,
  variables: Record<string, string>
): TemplateFile[] {
  return template.files.map(file => ({
    ...file,
    content: applyVariables(file.content, variables)
  }))
}

/**
 * Get category label
 */
export function getCategoryLabel(category: TemplateCategory): string {
  const labels: Record<TemplateCategory, string> = {
    article: 'Articles & Papers',
    thesis: 'Thesis & Dissertation',
    presentation: 'Presentations',
    cv: 'CV & Resume',
    letter: 'Letters',
    poster: 'Posters',
    other: 'Other'
  }
  return labels[category]
}
