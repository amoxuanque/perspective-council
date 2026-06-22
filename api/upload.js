// Vercel Serverless Function - File Upload & Parse
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);
    
    // Simple multipart parser
    const boundary = req.headers['content-type']?.split('boundary=')[1];
    if (!boundary) return res.status(400).json({ error: 'No boundary found' });
    
    const parts = buffer.toString('binary').split('--' + boundary);
    let fileContent = '';
    let fileName = '';
    
    for (const part of parts) {
      if (part.includes('filename="')) {
        const nameMatch = part.match(/filename="([^"]+)"/);
        fileName = nameMatch ? nameMatch[1] : 'unknown';
        const headerEnd = part.indexOf('\r\n\r\n');
        const body = part.slice(headerEnd + 4, part.lastIndexOf('\r\n'));
        
        const ext = fileName.split('.').pop().toLowerCase();
        
        if (['txt', 'md', 'csv'].includes(ext)) {
          fileContent = Buffer.from(body, 'binary').toString('utf8');
        } else if (ext === 'pdf') {
          // For PDF, return a message asking user to paste text
          fileContent = '[PDF文件] 请将PDF内容复制粘贴到输入框，或转换为TXT格式上传。';
        } else if (['doc', 'docx'].includes(ext)) {
          fileContent = '[Word文件] 请将内容复制粘贴到输入框，或转换为TXT/MD格式上传。';
        } else {
          fileContent = `[不支持的格式: ${ext}]`;
        }
      }
    }
    
    // Truncate to 8000 chars
    if (fileContent.length > 8000) {
      fileContent = fileContent.slice(0, 8000) + '\n\n[内容已截断，仅保留前8000字]';
    }
    
    res.json({ content: fileContent, fileName, length: fileContent.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
