# 🤖 AI Setup Guide for Data Alchemist

This guide will help you enable real AI features in your Data Alchemist application using OpenAI's GPT-4.

## 🚀 Quick Start

### 1. Get an OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in to your OpenAI account
3. Click "Create new secret key"
4. Copy the generated API key (it starts with `sk-`)

### 2. Configure Environment Variables

1. Open the `.env.local` file in your project root
2. Replace `your_openai_api_key_here` with your actual API key:

```env
OPENAI_API_KEY=sk-your-actual-api-key-here
OPENAI_MODEL=gpt-4
OPENAI_TEMPERATURE=0.3
OPENAI_MAX_TOKENS=2000
```

### 3. Restart Your Development Server

```bash
npm run dev
```

### 4. Verify AI Status

1. Open your application at `http://localhost:3000`
2. Navigate to the "AI Features" tab
3. You should see "AI Enabled" with a green checkmark

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | Required | `sk-...` |
| `OPENAI_MODEL` | AI model to use | `gpt-4` | `gpt-4`, `gpt-3.5-turbo` |
| `OPENAI_TEMPERATURE` | Creativity level (0-1) | `0.3` | `0.1` (focused) to `0.9` (creative) |
| `OPENAI_MAX_TOKENS` | Maximum response length | `2000` | `1000` to `4000` |

### Model Comparison

| Model | Speed | Cost | Quality | Best For |
|-------|-------|------|---------|----------|
| `gpt-4` | Slower | Higher | Best | Complex analysis, rule generation |
| `gpt-3.5-turbo` | Faster | Lower | Good | Basic search, simple suggestions |

## 💰 Cost Management

### Estimated Costs (GPT-4)

- **Natural Language Search**: ~$0.01-0.05 per query
- **Data Correction Suggestions**: ~$0.02-0.10 per analysis
- **Business Rule Generation**: ~$0.01-0.03 per rule
- **File Parsing Enhancement**: ~$0.01-0.05 per file

### Cost Optimization Tips

1. **Use GPT-3.5-turbo** for basic operations:
   ```env
   OPENAI_MODEL=gpt-3.5-turbo
   ```

2. **Reduce token limits** for simple queries:
   ```env
   OPENAI_MAX_TOKENS=1000
   ```

3. **Lower temperature** for more focused responses:
   ```env
   OPENAI_TEMPERATURE=0.1
   ```

## 🛠️ Troubleshooting

### Common Issues

#### 1. "AI Disabled" Status

**Problem**: AI status shows as disabled even with API key configured.

**Solution**:
- Check that your `.env.local` file is in the project root
- Ensure the API key doesn't have extra spaces
- Restart the development server after changes

#### 2. "API Key Invalid" Error

**Problem**: Getting authentication errors from OpenAI.

**Solution**:
- Verify your API key is correct
- Check your OpenAI account has sufficient credits
- Ensure the API key has the necessary permissions

#### 3. Rate Limiting Errors

**Problem**: Getting "rate limit exceeded" errors.

**Solution**:
- Wait a few minutes before making more requests
- Consider upgrading your OpenAI plan
- Implement request caching (future enhancement)

#### 4. Parsing Errors

**Problem**: AI responses can't be parsed as JSON.

**Solution**:
- The app automatically falls back to basic features
- Check the browser console for detailed error messages
- Try reducing the temperature for more consistent responses

### Debug Mode

To see detailed AI interaction logs, add this to your `.env.local`:

```env
NEXT_PUBLIC_DEBUG_AI=true
```

## 🔒 Security Best Practices

### 1. Never Commit API Keys

- `.env.local` is already in `.gitignore`
- Never share your API key in code or discussions
- Use environment variables for all sensitive data

### 2. API Key Rotation

- Regularly rotate your OpenAI API keys
- Monitor usage in your OpenAI dashboard
- Set up billing alerts to avoid unexpected charges

### 3. Rate Limiting

- The app includes built-in error handling
- Failed AI requests fall back to basic features
- Consider implementing request queuing for high-volume usage

## 🎯 AI Features Overview

### Enabled Features

With a valid API key, you get access to:

1. **🧠 Natural Language Search**
   - Query data in plain English
   - Semantic understanding of relationships
   - Context-aware results

2. **🔧 Smart Data Correction**
   - AI-powered data quality suggestions
   - Pattern recognition and anomaly detection
   - Actionable improvement recommendations

3. **⚖️ Intelligent Rule Generation**
   - Convert natural language to business rules
   - Context-aware rule interpretation
   - Validation and conflict detection

4. **📊 Enhanced File Parsing**
   - Automatic field mapping
   - Data type detection
   - Quality assessment and suggestions

### Fallback Features

Without an API key, the app still provides:

- Basic text-based search
- Pattern-based suggestions
- Simple rule parsing
- Standard file parsing

## 🚀 Next Steps

### Advanced Configuration

1. **Custom Prompts**: Modify AI prompts in `lib/ai-service.ts`
2. **Response Caching**: Implement caching to reduce API calls
3. **Batch Processing**: Process multiple requests together
4. **Custom Models**: Integrate with other AI providers

### Enterprise Features

1. **User Management**: Add role-based AI access
2. **Usage Analytics**: Track AI feature usage
3. **Cost Monitoring**: Real-time cost tracking
4. **Custom Training**: Train models on your specific data

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the browser console for error messages
3. Verify your OpenAI account status
4. Test with a simple API call using curl:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model":"gpt-4","messages":[{"role":"user","content":"Hello"}]}' \
     https://api.openai.com/v1/chat/completions
```

## 🎉 Success!

Once configured, you'll have access to powerful AI features that can:

- Understand complex natural language queries
- Provide intelligent data quality insights
- Generate sophisticated business rules
- Enhance data parsing accuracy

Your Data Alchemist application is now powered by cutting-edge AI! 🧪✨ 