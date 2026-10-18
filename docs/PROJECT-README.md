# 16 · My Places

React Native + TypeScript + Expo SDK 54, React Native Paper, React Navigation. На iOS/Android адреса хранятся в SQLite. Адрес ищется через Photon, пользователь выбирает результат, сохраняет его и открывает отдельный экран карты с маркером.

[Исходное условие](ASSIGNMENT.md) · [Полный мануал и все листинги](MANUAL.md) · [Общий запуск](../GROUP-RUN.md)

```bash
npm ci
npm run typecheck
npm test
npm start
```

На Mac нажмите `i` для Simulator; для Android — `a`, для браузера — `w`. Проект можно распаковать прямо в `<локальный-путь>` и выбирать его через `build-and-run.sh`.

В браузере используется localStorage и карта OpenStreetMap; нативные SQLite/карта проверяются на iOS/Android. Для тестов нужен Node 24. Подробные требования и сценарии в мануале.
