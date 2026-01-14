# Research Workbench - Test Cases

> Comprehensive testing guide with complex inputs for all modules.

---

## 1. LaTeX Editor (`/latex`)

### Test 1.1: Basic Document (WASM Offline)
```latex
\documentclass{article}
\usepackage{amsmath}
\usepackage{amssymb}

\title{Test Document}
\author{Research Workbench}
\date{\today}

\begin{document}
\maketitle

\section{Introduction}
This document tests the WASM LaTeX compiler. It should compile entirely in-browser without any server calls.

\section{Mathematics}
Inline math: $E = mc^2$ and $\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$

Display math:
\begin{equation}
    \nabla \times \mathbf{E} = -\frac{\partial \mathbf{B}}{\partial t}
\end{equation}

\begin{align}
    a &= b + c \\
    d &= e + f + g
\end{align}

Matrix:
\[
\mathbf{A} = \begin{pmatrix}
    1 & 2 & 3 \\
    4 & 5 & 6 \\
    7 & 8 & 9
\end{pmatrix}
\]

\section{Lists}
\begin{itemize}
    \item First item
    \item Second item with $x^2$
    \item Third item
\end{itemize}

\begin{enumerate}
    \item Numbered one
    \item Numbered two
    \item Numbered three
\end{enumerate}

\section{Conclusion}
If you see this PDF, WASM compilation works!

\end{document}
```

**Expected:** PDF renders with title, sections, math equations, lists.

### Test 1.2: XeTeX with Unicode
```latex
\documentclass{article}
\usepackage{fontspec}

\begin{document}
\section{Unicode Test}

Greek: \alpha \beta \gamma

Chinese: 你好世界

Japanese: こんにちは

Emoji should fail gracefully.

Math: $\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$

\end{document}
```

**Expected:** Should compile with XeTeX engine. Check engine selector.

### Test 1.3: Error Handling
```latex
\documentclass{article}
\begin{document}

This has an error: $\frac{1}{2$

Missing closing brace above.

\end{document}
```

**Expected:** Should show error with line number. PDF should NOT render.

### Test 1.4: Multi-file Project (if supported)
Main file `main.tex`:
```latex
\documentclass{article}
\begin{document}
\input{chapter1}
\input{chapter2}
\end{document}
```

`chapter1.tex`:
```latex
\section{Chapter One}
This is chapter one content.
```

`chapter2.tex`:
```latex
\section{Chapter Two}
This is chapter two content.
```

**Expected:** Should compile with all inputs resolved.

---

## 2. Paper Lens (`/papers`)

### Test 2.1: Import from ArXiv URL
```
https://arxiv.org/abs/1706.03762
```
(Attention Is All You Need - Transformer paper)

**Expected:**
- Title auto-populates: "Attention Is All You Need"
- Authors extracted
- Abstract shown
- PDF downloads

### Test 2.2: Import from ArXiv ID
```
2301.00001
```

**Expected:** Paper metadata fetched and displayed.

### Test 2.3: Manual PDF Import
Upload any local PDF file.

**Expected:**
- PDF renders in viewer
- Can scroll through pages
- Zoom works

### Test 2.4: Multiple Papers
Import these in sequence:
```
https://arxiv.org/abs/1706.03762
https://arxiv.org/abs/1810.04805
https://arxiv.org/abs/2005.14165
https://arxiv.org/abs/1412.6980
https://arxiv.org/abs/1409.1556
```

**Expected:** All 5 papers in library, searchable.

---

## 3. Prompt Lab (`/prompts`)

### Test 3.1: Basic Prompt
```
Explain quantum entanglement to a 10-year-old in 3 sentences.
```

**Expected:** Response generates (requires API key in settings).

### Test 3.2: Template with Variables
```
Write a {{length}} summary of {{topic}} focusing on {{aspect}}.
```

Variables:
- `length`: "200-word"
- `topic`: "machine learning transformers"
- `aspect`: "attention mechanisms"

**Expected:** Variable input fields appear, prompt interpolates correctly.

### Test 3.3: Multi-Model Comparison
Prompt:
```
What are the key differences between supervised and unsupervised learning?
```

Select models:
- GPT-4o-mini
- Claude 3.5 Sonnet
- Gemini Flash

**Expected:** Side-by-side responses, cost tracked for each.

### Test 3.4: Code Generation
```
Write a Python function that:
1. Takes a list of integers
2. Returns the two numbers that sum to a target
3. Include type hints and docstring
4. Handle edge cases
```

**Expected:** Code block in response, syntax highlighted.

### Test 3.5: Complex Analysis Prompt
```
Analyze the following research abstract and identify:
1. Main contribution
2. Methodology used
3. Key limitations
4. Potential future work

Abstract:
"We introduce a new architecture called the Transformer, based entirely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train."
```

**Expected:** Structured response addressing all 4 points.

---

## 4. Research Notes (`/notes`)

### Test 4.1: Basic Markdown Note
```markdown
# Research Meeting Notes - Jan 2026

## Attendees
- Dr. Smith
- Alice
- Bob

## Agenda
1. Project updates
2. Paper discussion
3. Next steps

## Discussion

### Project Alpha
The transformer model achieved **92% accuracy** on the test set.
We need to investigate the failure cases.

### Paper Review
Reviewed "Attention Is All You Need" - key insights:
- Self-attention replaces recurrence
- Positional encoding needed
- Multi-head attention improves performance

## Action Items
- [ ] Run ablation study
- [ ] Write results section
- [ ] Submit to ICML
```

**Expected:** Renders with headers, lists, checkboxes, bold text.

### Test 4.2: KaTeX Mathematics
```markdown
# Mathematical Derivations

## Softmax Function

The softmax function is defined as:

$$\text{softmax}(x_i) = \frac{e^{x_i}}{\sum_{j=1}^{n} e^{x_j}}$$

## Cross-Entropy Loss

For classification:

$$L = -\sum_{i=1}^{C} y_i \log(\hat{y}_i)$$

Where:
- $C$ is the number of classes
- $y_i$ is the true label (one-hot)
- $\hat{y}_i$ is the predicted probability

## Gradient Descent Update

$$\theta_{t+1} = \theta_t - \eta \nabla_\theta L(\theta_t)$$

Inline math works too: The learning rate $\eta = 0.001$ is typical.
```

**Expected:** All math renders correctly with KaTeX.

### Test 4.3: Wikilinks
```markdown
# Transformer Architecture

The [[Attention Mechanism]] is the core component.

See also:
- [[BERT Paper Notes]]
- [[GPT Series Overview]]
- [[Machine Learning Fundamentals]]

Related papers: [[Paper: Attention Is All You Need]]
```

**Expected:** Links are clickable, show as special styling.

### Test 4.4: Code Blocks
```markdown
# Implementation Notes

## Python Implementation

```python
import torch
import torch.nn as nn

class MultiHeadAttention(nn.Module):
    def __init__(self, d_model, num_heads):
        super().__init__()
        self.d_model = d_model
        self.num_heads = num_heads
        self.d_k = d_model // num_heads

        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)

    def forward(self, q, k, v, mask=None):
        batch_size = q.size(0)

        q = self.W_q(q).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        k = self.W_k(k).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        v = self.W_v(v).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)

        scores = torch.matmul(q, k.transpose(-2, -1)) / math.sqrt(self.d_k)

        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)

        attn = torch.softmax(scores, dim=-1)
        output = torch.matmul(attn, v)

        output = output.transpose(1, 2).contiguous().view(batch_size, -1, self.d_model)
        return self.W_o(output)
```

**Expected:** Syntax highlighting for Python code.

---

## 5. Knowledge Graph (`/graph`)

### Test 5.1: Graph Rendering
Prerequisites: Create at least:
- 3 papers in Paper Lens
- 5 notes with wikilinks between them
- 2 research questions

**Expected:**
- Graph shows nodes for papers (one color), notes (another color), questions (third color)
- Edges connect linked items
- Can drag nodes
- Can zoom/pan

### Test 5.2: Node Interaction
Click on any node.

**Expected:** Shows preview or navigates to the item.

### Test 5.3: Filtering
Use filter to show only:
- Papers only
- Notes only
- Questions only

**Expected:** Graph updates to show filtered subset.

### Test 5.4: Gap Detection
Create notes that don't link to anything.

**Expected:** Orphan nodes highlighted or shown in gap detection panel.

---

## 6. Research Questions (`/questions`)

### Test 6.1: Create Questions
Create these questions:

**Question 1:**
- Title: "How does self-attention scale with sequence length?"
- Status: Open
- Priority: High
- Notes: "Need to understand O(n^2) complexity and alternatives"

**Question 2:**
- Title: "What are the best practices for fine-tuning LLMs?"
- Status: In Progress
- Priority: Medium
- Notes: "Reviewing LoRA, prefix tuning, prompt tuning"

**Question 3:**
- Title: "How to evaluate hallucination in language models?"
- Status: Answered
- Priority: High
- Notes: "Found several metrics: factual consistency, faithfulness"

**Expected:** All questions saved, visible in list.

### Test 6.2: Link to Papers
Link Question 1 to papers about transformers.

**Expected:** Links saved, visible in question detail view.

### Test 6.3: Status Updates
Change Question 2 from "In Progress" to "Answered".

**Expected:** Status updates, reflected in list view.

---

## 7. ArXiv Radar (`/arxiv`)

### Test 7.1: Create Filter
Create filter:
- Categories: cs.LG, cs.CL
- Keywords: "transformer", "attention"
- Date: Last 7 days

**Expected:** Filter saves, can be reloaded.

### Test 7.2: Fetch Papers
Run the filter to fetch papers.

**Expected:** List of recent arXiv papers matching criteria.

### Test 7.3: Quick Import
Click "Add to Library" on a paper.

**Expected:** Paper imported to Paper Lens.

### Test 7.4: Multiple Filters
Create additional filters:
- "Reinforcement Learning": cs.LG + "reinforcement learning"
- "NLP": cs.CL + "language model"
- "Computer Vision": cs.CV + "image"

**Expected:** All filters saved, can switch between them.

---

## 8. Cost Dashboard (`/costs`)

### Test 8.1: View Charts
Prerequisites: Make some API calls in Prompt Lab first.

**Expected:**
- Pie chart by provider
- Bar chart by module
- Line chart over time

### Test 8.2: Set Budget
Set monthly budget: $10.00

**Expected:** Budget saved, shown in dashboard.

### Test 8.3: Budget Alert
If spending > 80% of budget, alert should show.

**Expected:** Warning banner or notification.

---

## 9. Settings (`/settings`)

### Test 9.1: API Keys
Add API keys:
- OpenAI: `sk-test-xxxxxxxxxxxxxxxxxxxx`
- Anthropic: `sk-ant-test-xxxxxxxxxxxx`
- Google: `AIzaSy-test-xxxxxxxxxx`

**Expected:** Keys saved (encrypted), masked in UI.

### Test 9.2: Theme Toggle
Switch between:
- Light mode
- Dark mode
- System

**Expected:** UI updates immediately.

### Test 9.3: Compilation Settings
Set:
- Default engine: XeTeX
- Timeout: 120 seconds

**Expected:** Settings saved, used in LaTeX editor.

### Test 9.4: Export Data
Click "Export All Data".

**Expected:** Downloads .zip file with all IndexedDB data.

### Test 9.5: Import Data
Import the exported .zip file on a fresh browser.

**Expected:** All data restored.

---

## 10. Dashboard (`/`)

### Test 10.1: Module Cards
All 9 module cards visible:
- LaTeX Editor
- Paper Lens
- Prompt Lab
- ArXiv Radar
- Research Notes
- Knowledge Graph
- Research Questions
- Cost Dashboard
- Settings

**Expected:** All cards clickable, navigate to correct routes.

### Test 10.2: Quick Actions
Test quick action buttons if present.

**Expected:** Actions execute correctly.

### Test 10.3: Recent Activity
After using other modules, return to dashboard.

**Expected:** Shows recent papers, notes, or activity (if implemented).

---

## Cross-Module Tests

### Test X.1: Paper to Note Link
1. Import a paper in Paper Lens
2. Create a note in Research Notes
3. Link the note to the paper using `@paper:ID` syntax

**Expected:** Link works, visible in Knowledge Graph.

### Test X.2: Question to Paper Link
1. Create a research question
2. Link it to multiple papers

**Expected:** Links visible in both Question view and Knowledge Graph.

### Test X.3: Cost Tracking Flow
1. Add API key in Settings
2. Run prompt in Prompt Lab
3. Check Cost Dashboard

**Expected:** Cost recorded and displayed in dashboard.

### Test X.4: Full Workflow
1. Import paper from ArXiv Radar
2. Generate summary in Paper Lens (uses API)
3. Create note about the paper
4. Create research question from insights
5. View everything in Knowledge Graph
6. Check costs in Cost Dashboard

**Expected:** All modules work together, data persists across sessions.

---

## Offline Tests

### Test O.1: Offline LaTeX
1. Disconnect from internet
2. Open LaTeX editor
3. Compile a basic document

**Expected:** Compiles successfully via WASM.

### Test O.2: Offline Data Access
1. Create notes, questions while online
2. Disconnect from internet
3. Access and edit existing data

**Expected:** IndexedDB data accessible offline.

### Test O.3: Offline Graceful Degradation
1. Disconnect from internet
2. Try to fetch ArXiv papers
3. Try to run Prompt Lab

**Expected:** Clear error messages explaining network required.

---

## Performance Tests

### Test P.1: Large Document
Compile a LaTeX document with 50+ pages.

**Expected:** Compiles without crashing, may take longer.

### Test P.2: Many Papers
Import 20+ papers to Paper Lens.

**Expected:** List remains responsive, search works.

### Test P.3: Large Note
Create a note with 10,000+ words.

**Expected:** Editor remains responsive, saves correctly.

---

## Browser Compatibility

Test all features in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## Error Handling

### Test E.1: Invalid API Key
Enter invalid API key, try to run prompt.

**Expected:** Clear error message about authentication.

### Test E.2: Network Timeout
Slow network simulation, try API calls.

**Expected:** Timeout error with retry option.

### Test E.3: Invalid LaTeX
Compile document with severe syntax errors.

**Expected:** Error displayed, no crash.

### Test E.4: Storage Full
Fill IndexedDB to capacity (if possible).

**Expected:** Warning before data loss.

---

## End of Test Cases
