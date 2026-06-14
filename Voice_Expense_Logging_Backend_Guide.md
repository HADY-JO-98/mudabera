# Guide: Implementing AI Voice Expense Parser (`POST /api/Expense/parse-voice`)

To enable smart voice-logged expenses, the backend needs to implement an AI parsing endpoint. This endpoint takes the raw transcript text recorded by the frontend, uses a generative AI model (such as Gemini or OpenAI) to extract structured financial data, and returns it to the client.

---

## 1. API Endpoint Specification

### **Request Details**
* **Path:** `POST /api/Expense/parse-voice`
* **Headers:** `Content-Type: application/json`, `Authorization: Bearer <JWT_TOKEN>`
* **Payload (`ParseVoiceRequestDto`):**
  ```json
  {
    "text": "صرفت خمسين جنيه على المواصلات امبارح"
  }
  ```

### **Response Details**
* **Status:** `200 OK`
* **Payload (`ParseVoiceResponseDto`):**
  ```json
  {
    "amount": 50.0,
    "category": "transport",
    "description": "مواصلات"
  }
  ```
  *(Note: `category` must match one of the predefined frontend database categories)*

---

## 2. Allowed Database Categories

The AI must map the parsed expense to one of these exact lowercase category strings:
* `food` (الطعام والبقالة)
* `transport` (المواصلات والكارت)
* `rent` (الإيجار)
* `electricity` (الكهرباء)
* `water` (المياه)
* `gas` (الغاز)
* `internet` (الإنترنت المنزلي)
* `mobile` (شحن الموبايل والشبكات)
* `shopping` (التسوق والملابس)
* `education` (التعليم والكورسات)
* `medical` (العلاج والعيادات)
* `entertainment` (الخروجات والفسح)
* `coffee` (المقاهي والكافيهات)
* `other` (أي مصاريف أخرى)

---

## 3. Recommended AI System Prompt

To ensure the AI extracts numbers accurately (even if spoken as text e.g., "خمسين" $\rightarrow$ `50`), detects the language, and maps categories correctly, use the following system prompt:

```text
You are a financial helper assistant for the "Modaber" application.
Your task is to parse a natural language transcript (which can be in English, Modern Standard Arabic, or Egyptian Arabic dialect) and convert it into a structured JSON expense object.

You must output a JSON object containing exactly these three fields:
1. "amount": (decimal) The numerical cost extracted. Convert word-numbers (like "خمسين", "fifty", "مية وخمسين") into digits (e.g. 50, 150). If no amount is found, return 0.
2. "category": (string) Match the expense to one of these exact categories: [food, transport, rent, electricity, water, gas, internet, mobile, shopping, education, medical, entertainment, coffee, other].
3. "description": (string) A clean, short summary of the purchase in the same language as the input text (e.g., "فواتير كهرباء", "طلب غداء").

Rules:
- Respond ONLY with the JSON block. Do not include markdown tags, formatting, or extra explanations.
- Map slang terms carefully: e.g. "أوبر" or "تاكسي" -> category "transport"; "ستاربكس" or "قهوة" -> category "coffee"; "فيزيتا" or "صيدلية" -> category "medical".
```

---

## 4. .NET Implementation Example (C#)

Below is an example implementation using standard `HttpClient` pointing to Google's **Gemini 2.5 Flash** (recommended for speed and low cost) or **OpenAI GPT-4o-mini**:

### **DTOs**
```csharp
public class ParseVoiceRequestDto
{
    public string Text { get; set; } = string.Empty;
}

public class ParseVoiceResponseDto
{
    public decimal Amount { get; set; }
    public string Category { get; set; } = "other";
    public string Description { get; set; } = string.Empty;
}
```

### **Controller Method**
```csharp
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ExpenseController : ControllerBase
{
    private readonly IAIParsingService _aiParsingService;

    public ExpenseController(IAIParsingService aiParsingService)
    {
        _aiParsingService = aiParsingService;
    }

    [HttpPost("parse-voice")]
    public async Task<ActionResult<ParseVoiceResponseDto>> ParseVoice([FromBody] ParseVoiceRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Text))
        {
            return BadRequest("Text transcript cannot be empty.");
        }

        try
        {
            var result = await _aiParsingService.ParseExpenseTextAsync(dto.Text);
            return Ok(result);
        }
        catch (Exception ex)
        {
            // Log exception details
            return StatusCode(500, $"AI parsing failed: {ex.Message}");
        }
    }
}
```

### **Gemini API Integration Service**
```csharp
using System.Text;
using System.Text.Json;

public interface IAIParsingService
{
    Task<ParseVoiceResponseDto> ParseExpenseTextAsync(string text);
}

public class GeminiParsingService : IAIParsingService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;

    public GeminiParsingService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _apiKey = configuration["Gemini:ApiKey"] ?? throw new ArgumentNullException("Gemini API Key is missing");
    }

    public async Task<ParseVoiceResponseDto> ParseExpenseTextAsync(string text)
    {
        var endpoint = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={_apiKey}";

        var systemInstruction = @"
You are a financial helper assistant. Parse the text and convert it into a structured JSON expense object.
You must output a JSON object containing exactly:
1. 'amount': (decimal) The numerical cost. Convert word-numbers into digits (e.g. 'خمسين' -> 50).
2. 'category': (string) Match exactly to one of: [food, transport, rent, electricity, water, gas, internet, mobile, shopping, education, medical, entertainment, coffee, other].
3. 'description': (string) A clean, short summary of the purchase in the input language.

Return ONLY raw JSON. Do not include ```json formatting or explanations.";

        var payload = new
        {
            contents = new[]
            {
                new { parts = new[] { new { text = text } } }
            },
            systemInstruction = new
            {
                parts = new[] { new { text = systemInstruction } }
            },
            generationConfig = new
            {
                responseMimeType = "application/json"
            }
        };

        var jsonPayload = JsonSerializer.Serialize(payload);
        var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync(endpoint, content);
        response.EnsureSuccessStatusCode();

        var responseBody = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(responseBody);
        
        // Extract the text output from Gemini response tree
        var aiResponseText = doc.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString();

        if (string.IsNullOrWhiteSpace(aiResponseText))
        {
            return new ParseVoiceResponseDto { Amount = 0, Category = "other", Description = text };
        }

        var parsedResult = JsonSerializer.Deserialize<ParseVoiceResponseDto>(aiResponseText, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        return parsedResult ?? new ParseVoiceResponseDto { Amount = 0, Category = "other", Description = text };
    }
}
```

---

## 5. Deployment / Configuration Notes
1. **API Key Storage:** Add the Gemini or OpenAI API Key in `appsettings.json` (or Environment variables in Azure/server host):
   ```json
   "Gemini": {
     "ApiKey": "YOUR_GEMINI_API_KEY_HERE"
   }
   ```
2. **CORS:** Ensure CORS policy allows requests from the frontend client origin.
