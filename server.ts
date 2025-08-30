import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// .env 파일 로드
dotenv.config();

// 환경변수 설정
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PORT = process.env.PORT || '8787';

// API 키 검증
if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.');
  console.error('   .env 파일에 OPENAI_API_KEY=your_api_key_here를 추가해주세요.');
  process.exit(1);
}

const app = express();
app.use(cors());

// 대용량 파일 처리를 위한 body parser 설정
app.use(express.json({ limit: '50mb' }));
app.use(express.text({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 서버 상태 확인용 GET 엔드포인트
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Chat API Server is running',
    timestamp: new Date().toISOString(),
    bodyParserLimit: '50MB'
  });
});

/** simple exponential backoff wrapper */
async function withBackoff<T>(fn: () => Promise<T>, max = 4) {
  let delay = 500;
  for (let i = 0; i < max; i++) {
    try {
      return await fn();
    } catch (e: any) {
      const status = e?.status || e?.response?.status;
      if (status !== 429 || i === max - 1) throw e;
      console.log(`Rate limited, retrying in ${delay}ms... (attempt ${i + 1}/${max})`);
      await new Promise(r => setTimeout(r, delay));
      delay *= 2; // 0.5s -> 1s -> 2s -> 4s
    }
  }
  throw new Error('unreachable');
}

app.post('/api/chat', async (req, res) => {
  let { messages, fileContent, model = 'gpt-4o-mini', max_tokens = 8000, temperature = 0.7 } = req.body || {};

  // 디버깅: 받은 데이터 확인
  console.log('📁 Server received:', {
    messagesCount: messages?.length,
    fileContentLength: fileContent?.length,
    hasFileContent: !!fileContent,
    firstMessageContent: messages?.[0]?.content?.substring(0, 100)
  });

  // 파일 내용이 너무 크면 잘라내기 (OpenAI API 제한)
  if (fileContent && fileContent.length > 100000) {
    console.log('⚠️ File content too large, truncating...');
    fileContent = fileContent.substring(0, 100000) + '\n\n... (내용이 너무 길어서 잘렸습니다)';
  }

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  // 파일 내용이 있으면 첫 번째 사용자 메시지에 추가
  let apiMessages = [...messages];
  
  // 시스템 프롬프트가 아닌 실제 사용자 메시지를 찾기
  const userMessageIndex = messages.findIndex(msg => msg.role === 'user');
  
  if (fileContent && userMessageIndex !== -1) {
    const filePrefix = '첨부된 파일 내용:';
    const questionPrefix = '사용자 질문:';
    
    apiMessages[userMessageIndex] = {
      ...messages[userMessageIndex],
      content: `${filePrefix}\n${fileContent}\n\n${questionPrefix} ${messages[userMessageIndex].content}`
    };

    // 디버깅: 파일 내용 처리 후 확인
    console.log('📝 Processed message:', {
      userMessageIndex,
      originalLength: messages[userMessageIndex].content.length,
      newLength: apiMessages[userMessageIndex].content.length,
      fileContentPreview: fileContent.substring(0, 200) + '...'
    });
  }

  const payload = { model, messages: apiMessages, max_tokens, temperature, stream: false };

  try {
    const data = await withBackoff(async () => {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (r.status === 429) {
        const detail = await r.json().catch(() => ({}));
        const err: any = new Error('rate limited');
        err.status = 429;
        err.detail = detail;
        throw err;
      }
      if (!r.ok) {
        const text = await r.text();
        const err: any = new Error(`OpenAI API error: ${text}`);
        err.status = r.status;
        err.detail = text;
        throw err;
      }
      return r.json();
    });

    res.json(data);
  } catch (err: any) {
    console.error('Chat API error:', err);
    const detail = err?.detail || { error: err?.message || 'unknown error' };
    res.status(err?.status || 500).json(detail);
  }
});

app.listen(PORT, () => console.log(`🚀 Chat API listening on http://localhost:${PORT}`)); 