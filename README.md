# BITE

AI restaurant finder for Astana, Kazakhstan.

Mobile-first React + Tailwind CSS MVP with real server-side recommendation endpoint scaffold, mock fallback mode, and API-ready architecture.

## Stack
- React
- Vite
- Tailwind CSS
- Vercel Serverless Functions
- 2GIS Places API
- 2GIS Routing API
- AI model API

## Возможности
- Mobile-first интерфейс на русском языке.
- Поиск мест по геолокации, бюджету, типу заведения, рейтингу и времени в пути.
- Server-side endpoint `/api/recommend` для безопасной интеграции с 2GIS и AI.
- Mock fallback режим для локального тестирования без API ключей.
- Compact AI assistant, который открывается только по нажатию.
- Запрос геолокации в начале использования приложения.

## Environment variables
Создай файл `.env` для локального запуска:

```bash
TWO_GIS_API_KEY=your_2gis_key_here
AI_API_KEY=your_ai_key_here
AI_API_URL=https://api.openai.com/v1/chat/completions
VITE_USE_MOCK_RECOMMEND=true
```

### Что означает каждая переменная
- `TWO_GIS_API_KEY` — ключ для Places API и Routing API 2GIS.
- `AI_API_KEY` — ключ AI provider для ранжирования и коротких explanations.
- `AI_API_URL` — endpoint AI model API, можно заменить под нужного провайдера.
- `VITE_USE_MOCK_RECOMMEND` — если `true`, frontend использует mock recommendation flow, если ключей пока нет.

## Где взять 2GIS API key
1. Перейди на [2GIS Dev Center](https://dev.2gis.com/).
2. Создай аккаунт или войди в существующий.
3. Создай приложение в панели разработчика.
4. Получи API key для Places API и Routing API.
5. Добавь ключ в `.env` как `TWO_GIS_API_KEY`.

Проверь текущую документацию 2GIS по лимитам, доступным продуктам и формату запросов перед production deployment.

## Локальный запуск
1. Склонируй репозиторий.
2. Установи зависимости:

```bash
npm install
```

3. Создай `.env` по примеру выше.
4. Запусти dev server:

```bash
npm run dev
```

5. Открой локальный адрес Vite в браузере.

## Тестирование без ключей
Если ключей 2GIS и AI пока нет, приложение все равно можно проверить.

1. Оставь `VITE_USE_MOCK_RECOMMEND=true`.
2. Не добавляй `TWO_GIS_API_KEY` и `AI_API_KEY`.
3. Запусти проект локально.
4. Приложение будет использовать mock restaurants и локальную recommendation logic.

Это удобно для проверки UI, UX, фильтров, saved flow, AI sheet и геолокационного сценария без внешних API.

## Как работает `/api/recommend`
Endpoint принимает:
- `location`: `{ latitude, longitude }`
- `budget_max_kzt`
- `venue_types`
- `min_rating`
- `max_travel_minutes`
- `transport_mode`
- `query` — optional natural language query

### Server flow
1. Получить реальные места через 2GIS Places API.
2. Для каждого места получить route metrics через 2GIS Routing API.
3. Отфильтровать места по бюджету, типу, рейтингу и времени.
4. Передать в AI только реальные структурированные данные.
5. Получить строго JSON с parsed intent, ranked recommendations и relaxation suggestion.
6. Если AI недоступен, применить deterministic fallback ranking на сервере.

## Vercel deployment
1. Залей проект в GitHub.
2. Импортируй репозиторий в [Vercel](https://vercel.com/).
3. В настройках проекта добавь environment variables:
   - `TWO_GIS_API_KEY`
   - `AI_API_KEY`
   - `AI_API_URL`
   - `VITE_USE_MOCK_RECOMMEND=false`
4. Нажми Deploy.
5. После деплоя endpoint будет доступен по пути `/api/recommend`.

### Важно
- Не храни `TWO_GIS_API_KEY` и `AI_API_KEY` в client-side коде.
- Все вызовы 2GIS и AI должны идти только через server-side endpoint.
- Для production можно добавить rate limiting, logging, caching и schema validation.

## Структура
- `src/` — UI, mock data, client-side logic.
- `api/recommend.js` — serverless endpoint для 2GIS + AI recommendation flow.
- `src/lib/recommendation.js` — deterministic fallback ranking logic.
- `src/lib/aiParser.js` — client-side parsing для mock mode.

## Запрос к `/api/recommend`
Пример body:

```json
{
  "location": {
    "latitude": 51.1282,
    "longitude": 71.4304
  },
  "budget_max_kzt": 10000,
  "venue_types": ["cafe", "restaurant"],
  "min_rating": 4.5,
  "max_travel_minutes": 20,
  "transport_mode": "car",
  "query": "Хочу атмосферное место для свидания, чтобы было не очень дорого"
}
```

Пример response:

```json
{
  "parsed_intent": {
    "budget_max_kzt": 10000,
    "venue_types": ["cafe", "restaurant"],
    "min_rating": 4.5,
    "max_travel_minutes": 20,
    "transport_mode": "car",
    "vibe": ["cozy", "date"]
  },
  "recommendations": [
    {
      "place_id": "2gis-place-id",
      "rank": 1,
      "match_score": 94,
      "reason_ru": "Высокий рейтинг, близко и подходит по бюджету"
    }
  ],
  "relaxation_suggestion_ru": null
}
```
