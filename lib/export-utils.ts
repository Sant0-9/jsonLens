import { JsonValue } from '@/store/json-store';
import JSZip from 'jszip';
import { convertToCSV, convertToYAML, convertToNDJSON } from './converters';

export interface ExportOptions {
  includeJson: boolean;
  includeCsv: boolean;
  includeYaml: boolean;
  includeNdjson: boolean;
  includeHtml: boolean;
  htmlTitle?: string;
  htmlDescription?: string;
}

export async function exportToZip(
  data: JsonValue,
  filename: string = 'jsonlens-export',
  options: ExportOptions = {
    includeJson: true,
    includeCsv: true,
    includeYaml: true,
    includeNdjson: true,
    includeHtml: true,
    htmlTitle: 'JSONLens Export',
    htmlDescription: 'Data exported from JSONLens',
  }
): Promise<void> {
  const zip = new JSZip();
  
  // Add JSON file
  if (options.includeJson) {
    zip.file('data.json', JSON.stringify(data, null, 2));
  }
  
  // Add CSV file
  if (options.includeCsv) {
    const csvResult = convertToCSV(data);
    if (csvResult.success && typeof csvResult.data === 'string') {
      zip.file('data.csv', csvResult.data);
    }
  }
  
  // Add YAML file
  if (options.includeYaml) {
    const yamlResult = convertToYAML(data);
    if (yamlResult.success && typeof yamlResult.data === 'string') {
      zip.file('data.yaml', yamlResult.data);
    }
  }
  
  // Add NDJSON file
  if (options.includeNdjson) {
    const ndjsonResult = convertToNDJSON(data);
    if (ndjsonResult.success && typeof ndjsonResult.data === 'string') {
      zip.file('data.ndjson', ndjsonResult.data);
    }
  }
  
  // Add HTML file
  if (options.includeHtml) {
    const htmlContent = generateHtmlExport(data, options.htmlTitle, options.htmlDescription);
    zip.file('data.html', htmlContent);
  }
  
  // Add README
  const readme = generateReadme(data, options);
  zip.file('README.md', readme);
  
  // Generate and download ZIP
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToHtml(
  data: JsonValue,
  title: string = 'JSONLens Export',
  description: string = 'Data exported from JSONLens'
): void {
  const htmlContent = generateHtmlExport(data, title, description);
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'export.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function generateHtmlExport(
  data: JsonValue,
  title: string,
  description: string
): string {
  const jsonStr = JSON.stringify(data, null, 2);
  const dataSize = new Blob([jsonStr]).size;
  const itemCount = Array.isArray(data) ? data.length : 1;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .header p {
            margin: 0;
            opacity: 0.9;
            font-size: 1.1em;
        }
        .stats {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-top: 20px;
        }
        .stat {
            text-align: center;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .stat-label {
            font-size: 0.9em;
            opacity: 0.8;
        }
        .content {
            padding: 30px;
        }
        .json-container {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 20px;
            margin-top: 20px;
            overflow-x: auto;
        }
        pre {
            margin: 0;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 14px;
            line-height: 1.4;
            color: #333;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            border-top: 1px solid #e9ecef;
        }
        .footer a {
            color: #667eea;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
        @media (max-width: 768px) {
            .stats {
                flex-direction: column;
                gap: 15px;
            }
            .header h1 {
                font-size: 2em;
            }
            .content {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${escapeHtml(title)}</h1>
            <p>${escapeHtml(description)}</p>
            <div class="stats">
                <div class="stat">
                    <div class="stat-value">${itemCount.toLocaleString()}</div>
                    <div class="stat-label">${Array.isArray(data) ? 'Items' : 'Object'}</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${formatBytes(dataSize)}</div>
                    <div class="stat-label">Size</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${new Date().toLocaleDateString()}</div>
                    <div class="stat-label">Exported</div>
                </div>
            </div>
        </div>
        
        <div class="content">
            <h2>JSON Data</h2>
            <div class="json-container">
                <pre>${escapeHtml(jsonStr)}</pre>
            </div>
        </div>
        
        <div class="footer">
            <p>Generated by <a href="https://github.com/your-username/jsonlens" target="_blank">JSONLens</a> • 
            <a href="#" onclick="window.print()">Print this page</a></p>
        </div>
    </div>
</body>
</html>`;
}

function generateReadme(data: JsonValue, options: ExportOptions): string {
  const itemCount = Array.isArray(data) ? data.length : 1;
  const dataSize = new Blob([JSON.stringify(data)]).size;
  
  let content = `# JSONLens Export\n\n`;
  content += `**Generated:** ${new Date().toISOString()}\n`;
  content += `**Items:** ${itemCount.toLocaleString()}\n`;
  content += `**Size:** ${formatBytes(dataSize)}\n\n`;
  
  content += `## Files Included\n\n`;
  if (options.includeJson) content += `- \`data.json\` - Original JSON data\n`;
  if (options.includeCsv) content += `- \`data.csv\` - CSV format (if applicable)\n`;
  if (options.includeYaml) content += `- \`data.yaml\` - YAML format\n`;
  if (options.includeNdjson) content += `- \`data.ndjson\` - Newline Delimited JSON\n`;
  if (options.includeHtml) content += `- \`data.html\` - HTML report\n`;
  
  content += `\n## Data Structure\n\n`;
  if (Array.isArray(data)) {
    content += `This is an array containing ${data.length} items.\n\n`;
    if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
      const sample = data[0] as Record<string, unknown>;
      const keys = Object.keys(sample);
      content += `**Sample item keys:** ${keys.join(', ')}\n\n`;
    }
  } else if (typeof data === 'object' && data !== null) {
    const keys = Object.keys(data);
    content += `This is an object with ${keys.length} properties.\n\n`;
    content += `**Properties:** ${keys.join(', ')}\n\n`;
  } else {
    content += `This is a primitive value: ${typeof data}\n\n`;
  }
  
  content += `## About JSONLens\n\n`;
  content += `This export was generated by JSONLens, a powerful JSON visualization and analysis tool.\n\n`;
  content += `Features:\n`;
  content += `- Interactive tree and table views\n`;
  content += `- JSON diff and query capabilities\n`;
  content += `- Schema inference and validation\n`;
  content += `- Data transformation tools\n`;
  content += `- Multiple export formats\n\n`;
  content += `Visit [JSONLens](https://github.com/your-username/jsonlens) for more information.\n`;
  
  return content;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}