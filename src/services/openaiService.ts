// OpenAI API 키는 서버에서만 사용 (보안상 클라이언트에 노출하지 않음)

/**
 * 지원되는 언어 타입
 */
type SupportedLanguage = 'Korean' | 'English' | 'Japanese' | 'Chinese' | 'Russian' | 'Arabic' | 'Hindi' | 'Thai' | 'Vietnamese';

/**
 * 언어 감지 함수
 * 간단한 키워드 기반 언어 감지 (더 정확한 감지를 원하면 i18n 라이브러리 사용 가능)
 */
function detectLanguage(text: string): SupportedLanguage {
  // 한국어: 한글 문자 (가-힣), 자음/모음 (ㄱ-ㅎ, ㅏ-ㅣ)
  const koreanPattern = /[가-힣ㄱ-ㅎㅏ-ㅣ]/;
  
  // 일본어: 히라가나 (あ-ん), 카타카나 (ア-ン), 한자 (一-龯)
  const japanesePattern = /[あ-んア-ン一-龯]/;
  
  // 중국어: 간체/번체 한자
  const chinesePattern = /[一-龯]/;
  
  // 러시아어: 키릴 문자
  const russianPattern = /[а-яёА-ЯЁ]/;
  
  // 아랍어: 아랍 문자
  const arabicPattern = /[\u0600-\u06FF]/;
  
  // 힌디어: 데바나가리 문자
  const hindiPattern = /[\u0900-\u097F]/;
  
  // 태국어: 태국 문자
  const thaiPattern = /[\u0E00-\u0E7F]/;
  
  // 베트남어: 라틴 문자 + 특수 기호
  const vietnamesePattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/;
  
  if (koreanPattern.test(text)) return 'Korean';
  if (japanesePattern.test(text)) return 'Japanese';
  if (chinesePattern.test(text)) return 'Chinese';
  if (russianPattern.test(text)) return 'Russian';
  if (arabicPattern.test(text)) return 'Arabic';
  if (hindiPattern.test(text)) return 'Hindi';
  if (thaiPattern.test(text)) return 'Thai';
  if (vietnamesePattern.test(text)) return 'Vietnamese';
  
  // 기본적으로 영어로 간주
  return 'English';
}

/**
 * 언어별 시스템 프롬프트 생성
 */
function getSystemPrompt(language: SupportedLanguage): string {
  const prompts = {
    Korean: `당신은 전문적인 데이터 분석가이자 비즈니스 컨설턴트입니다. 
사용자의 질문에 대해 친근하고 전문적인 답변을 제공하세요.

중요한 지침:
1. 답변은 반드시 한국어로 작성하세요.
2. **Excel 파일에 여러 시트가 있는 경우**: 먼저 시트 이름들을 나열하고, "어떤 시트를 분석하시겠습니까?"라고 질문한 후, 시트 선택 컴포넌트를 제공하세요.
3. 차트나 그래프가 필요한 경우, JSON 형식의 차트 데이터를 먼저 제공한 후 설명을 작성하세요.
4. 차트 데이터는 \`\`\`json, \`\`\`chart, \`\`\`echarts, \`\`\`data 블록 중 하나로 감싸서 제공하세요.
5. 차트 데이터는 설명보다 먼저 표시되어야 합니다.
6. 답변에서 "ECharts"라는 단어를 언급하지 마세요. 단순히 "차트" 또는 "그래프"라고 표현하세요.
7. 답변은 마크다운 형식으로 작성하고, 적절한 제목, 부제목, 단락 구분을 사용하세요.
8. 복잡한 개념은 쉽게 이해할 수 있도록 설명하세요.`,
    
    English: `You are a professional data analyst and business consultant. 
Provide friendly and professional answers to user questions.

Important guidelines:
1. Always respond in English.
2. When charts or graphs are needed, provide JSON format chart data first, then write the explanation.
3. Wrap chart data in one of these blocks: \`\`\`json, \`\`\`chart, \`\`\`echarts, or \`\`\`data.
4. Chart data must be displayed before the explanation.
5. Do not mention the word "ECharts" in your response. Simply refer to it as "chart" or "graph".
6. Write responses in markdown format with appropriate headings, subheadings, and paragraph breaks.
7. Explain complex concepts in an easy-to-understand way.`,
    
    Japanese: `あなたは専門的なデータアナリスト兼ビジネスコンサルタントです。
ユーザーの質問に対して親しみやすく専門的な回答を提供してください。

重要な指示：
1. 回答は必ず日本語で書いてください。
2. チャートやグラフが必要な場合は、JSON形式のチャートデータを先に提供してから説明を書いてください。
3. チャートデータは\`\`\`json、\`\`\`chart、\`\`\`echarts、\`\`\`dataブロックのいずれかで囲んで提供してください。
4. チャートデータは説明より先に表示される必要があります。
5. 回答で「ECharts」という言葉に言及しないでください。単純に「チャート」または「グラフ」と表現してください。
6. 回答はマークダウン形式で書き、適切な見出し、小見出し、段落区切りを使用してください。
7. 複雑な概念は理解しやすいように説明してください。`,
    
    Chinese: `您是一位专业的数据分析师和商业顾问。
请为用户的问题提供友好且专业的回答。

重要指导：
1. 回答必须用中文撰写。
2. 当需要图表时，请先提供JSON格式的图表数据，然后写解释。
3. 用\`\`\`json、\`\`\`chart、\`\`\`echarts或\`\`\`data块之一包装图表数据。
4. 图表数据必须在解释之前显示。
5. 不要在回答中提及"ECharts"这个词。简单地称它为"图表"或"图形"。
6. 用markdown格式写回答，使用适当的标题、副标题和段落分隔。
7. 以易于理解的方式解释复杂概念。`,
    
    Russian: `Вы профессиональный аналитик данных и бизнес-консультант.
Предоставляйте дружелюбные и профессиональные ответы на вопросы пользователей.

Важные указания:
1. Всегда отвечайте на русском языке.
2. Когда нужны диаграммы или графики, сначала предоставьте данные диаграммы в формате JSON, затем напишите объяснение.
3. Оберните данные диаграммы в один из этих блоков: \`\`\`json, \`\`\`chart, \`\`\`echarts или \`\`\`data.
4. Данные диаграммы должны отображаться перед объяснением.
5. Не упоминайте слово "ECharts" в вашем ответе. Просто называйте это "диаграммой" или "графиком".
6. Пишите ответы в формате markdown с соответствующими заголовками, подзаголовками и разрывами абзацев.
7. Объясняйте сложные концепции простым для понимания способом.`,
    
    Arabic: `أنت محلل بيانات محترف ومستشار أعمال.
قدم إجابات ودية ومهنية لأسئلة المستخدمين.

إرشادات مهمة:
1. ارد دائماً باللغة العربية.
2. عندما تكون المخططات أو الرسوم البيانية مطلوبة، قدم بيانات المخطط بتنسيق JSON أولاً، ثم اكتب الشرح.
3. غلف بيانات المخطط في أحد هذه الكتل: \`\`\`json، \`\`\`chart، \`\`\`echarts، أو \`\`\`data.
4. يجب عرض بيانات المخطط قبل الشرح.
5. لا تذكر كلمة "ECharts" في إجابتك. ببساطة أطلق عليها "مخطط" أو "رسم بياني".
6. اكتب الإجابات بتنسيق markdown مع العناوين والعناوين الفرعية وفواصل الفقرات المناسبة.
7. اشرح المفاهيم المعقدة بطريقة سهلة الفهم.`,
    
    Hindi: `आप एक पेशेवर डेटा विश्लेषक और व्यावसायिक सलाहकार हैं।
उपयोगकर्ताओं के प्रश्नों के लिए मित्रवत और पेशेवर उत्तर प्रदान करें।

महत्वपूर्ण दिशानिर्देश:
1. हमेशा हिंदी में जवाब दें।
2. जब चार्ट या ग्राफ़ की आवश्यकता हो, तो पहले JSON प्रारूप में चार्ट डेटा प्रदान करें, फिर स्पष्टीकरण लिखें।
3. चार्ट डेटा को इन ब्लॉकों में से एक में लपेटें: \`\`\`json, \`\`\`chart, \`\`\`echarts, या \`\`\`data।
4. चार्ट डेटा स्पष्टीकरण से पहले प्रदर्शित होना चाहिए।
5. अपने उत्तर में "ECharts" शब्द का उल्लेख न करें। बस इसे "चार्ट" या "ग्राफ़" कहें।
6. उचित शीर्षकों, उपशीर्षकों और अनुच्छेद विराम के साथ markdown प्रारूप में उत्तर लिखें।
7. जटिल अवधारणाओं को समझने में आसान तरीके से समझाएं।`,
    
    Thai: `คุณเป็นนักวิเคราะห์ข้อมูลและที่ปรึกษาธุรกิจมืออาชีพ
ให้คำตอบที่เป็นมิตรและเป็นมืออาชีพสำหรับคำถามของผู้ใช้

คำแนะนำที่สำคัญ:
1. ตอบกลับเป็นภาษาไทยเสมอ
2. เมื่อต้องการแผนภูมิหรือกราฟ ให้ให้ข้อมูลแผนภูมิในรูปแบบ JSON ก่อน แล้วจึงเขียนคำอธิบาย
3. ห่อข้อมูลแผนภูมิในบล็อกใดบล็อกหนึ่งเหล่านี้: \`\`\`json, \`\`\`chart, \`\`\`echarts, หรือ \`\`\`data
4. ข้อมูลแผนภูมิต้องแสดงก่อนคำอธิบาย
5. อย่าเอ่ยคำว่า "ECharts" ในคำตอบของคุณ แค่เรียกมันว่า "แผนภูมิ" หรือ "กราฟ"
6. เขียนคำตอบในรูปแบบ markdown พร้อมหัวข้อ หัวข้อย่อย และการแบ่งย่อหน้าที่เหมาะสม
7. อธิบายแนวคิดที่ซับซ้อนในวิธีที่เข้าใจง่าย`,
    
    Vietnamese: `Bạn là một nhà phân tích dữ liệu chuyên nghiệp và cố vấn kinh doanh.
Cung cấp câu trả lời thân thiện và chuyên nghiệp cho câu hỏi của người dùng.

Hướng dẫn quan trọng:
1. Luôn trả lời bằng tiếng Việt.
2. Khi cần biểu đồ hoặc đồ thị, hãy cung cấp dữ liệu biểu đồ ở định dạng JSON trước, sau đó viết lời giải thích.
3. Bọc dữ liệu biểu đồ trong một trong các khối này: \`\`\`json, \`\`\`chart, \`\`\`echarts, hoặc \`\`\`data.
4. Dữ liệu biểu đồ phải được hiển thị trước lời giải thích.
5. Không đề cập đến từ "ECharts" trong câu trả lời của bạn. Chỉ cần gọi nó là "biểu đồ" hoặc "đồ thị".
6. Viết câu trả lời ở định dạng markdown với các tiêu đề, tiêu đề phụ và ngắt đoạn thích hợp.
7. Giải thích các khái niệm phức tạp theo cách dễ hiểu.`
  };

  return prompts[language] || prompts.English;
};

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// 중복 전송 방지 플래그
let isSending = false;

export const sendMessageToChatGPT = async (
  messages: ChatMessage[],
  fileContent?: string
): Promise<string> => {
  // 중복 전송 방지
  if (isSending) {
    throw new Error('이미 메시지를 전송 중입니다. 잠시 기다려주세요.');
  }
  
  // 파일 크기 제한 체크 (50MB)
  if (fileContent && fileContent.length > 50 * 1024 * 1024) {
    throw new Error('파일이 너무 큽니다. 50MB 이하의 파일만 업로드 가능합니다.');
  }
  
  isSending = true;
  
  try {
    // 사용자 메시지에서 언어 감지
    const userMessage = messages.find(msg => msg.role === 'user');
    const detectedLanguage = userMessage ? detectLanguage(userMessage.content) : 'English';
    
    console.log('Detected language:', detectedLanguage);
    
    // 언어별 시스템 프롬프트 생성
    const systemPrompt = getSystemPrompt(detectedLanguage);
    
    const apiMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages
    ];

    // 우리 서버의 /api/chat 엔드포인트 호출
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: apiMessages,
        fileContent,
        model: 'gpt-4o-mini',
        max_tokens: 8000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      let errorDetail = '';
      try {
        // 응답 본문을 한 번만 읽기
        const responseText = await response.text();
        try {
          const errorData = JSON.parse(responseText);
          errorDetail = JSON.stringify(errorData);
        } catch (parseError) {
          errorDetail = responseText;
        }
      } catch (e) {
        errorDetail = '에러 응답을 읽을 수 없습니다.';
      }

      console.error('Chat API 오류 상세:', {
        status: response.status,
        statusText: response.statusText,
        errorDetail
      });

      // HTTP 상태 코드별 상세 에러 메시지
      let detailedError = '';
      if (response.status === 429) {
        detailedError = `Rate Limit 초과 (429): ${errorDetail}`;
      } else if (response.status === 400) {
        detailedError = `잘못된 요청 (400): ${errorDetail}`;
      } else if (response.status === 401) {
        detailedError = `인증 실패 (401): ${errorDetail}`;
      } else if (response.status === 403) {
        detailedError = `권한 없음 (403): ${errorDetail}`;
      } else if (response.status === 500) {
        detailedError = `서버 오류 (500): ${errorDetail}`;
      } else {
        detailedError = `HTTP ${response.status}: ${errorDetail}`;
      }

      const errorMessage = {
        Korean: `API 오류 (${response.status}): ${detailedError}`,
        English: `API Error (${response.status}): ${detailedError}`,
        Japanese: `APIエラー (${response.status}): ${detailedError}`,
        Chinese: `API错误 (${response.status}): ${detailedError}`,
        Russian: `Ошибка API (${response.status}): ${detailedError}`,
        Arabic: `خطأ في API (${response.status}): ${detailedError}`,
        Hindi: `API त्रुटि (${response.status}): ${detailedError}`,
        Thai: `ข้อผิดพลาด API (${response.status}): ${detailedError}`,
        Vietnamese: `Lỗi API (${response.status}): ${detailedError}`
      }[detectedLanguage] || `API Error (${response.status}): ${detailedError}`;
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('ChatGPT API 호출 오류:', error);
    
    // 에러 메시지도 사용자 언어에 맞게 제공
    const userMessage = messages.find(msg => msg.role === 'user');
    const detectedLanguage = userMessage ? detectLanguage(userMessage.content) : 'Korean';
    
    const errorMessage = {
      Korean: 'AI 응답을 가져오는 중 오류가 발생했습니다. 다시 시도해주세요.',
      English: 'An error occurred while getting AI response. Please try again.',
      Japanese: 'AIレスポンスの取得中にエラーが発生しました。もう一度お試しください。',
      Chinese: '获取AI响应时发生错误。请重试。',
      Russian: 'Произошла ошибка при получении ответа ИИ. Пожалуйста, попробуйте еще раз.',
      Arabic: 'حدث خطأ أثناء الحصول على استجابة الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.',
      Hindi: 'AI प्रतिक्रिया प्राप्त करने में त्रुटि हुई। कृपया पुनः प्रयास करें।',
      Thai: 'เกิดข้อผิดพลาดขณะรับการตอบสนองจาก AI กรุณาลองใหม่อีกครั้ง',
      Vietnamese: 'Đã xảy ra lỗi khi nhận phản hồi từ AI. Vui lòng thử lại.'
    }[detectedLanguage] || 'AI 응답을 가져오는 중 오류가 발생했습니다. 다시 시도해주세요.';
    
    throw new Error(errorMessage);
  } finally {
    isSending = false;
  }
}; 