# Phishing Literacy Test

**Репозиторий:** [github.com/matos85/phishing-literacy-test](https://github.com/matos85/phishing-literacy-test)  
HTTPS: `https://github.com/matos85/phishing-literacy-test.git`

Учебный лендинг и форма регистрации с админ-панелью: фронтенд на **Vue 3 + Vite**, бэкенд на **Node.js** (без фреймворка, `http`), база **MySQL**. Сборка для продакшена — **Docker**.

## Возможности

| Область | Описание |
|---------|----------|
| Публичная часть | Лендинг, многошаговая регистрация в «розыгрыш», сценарий с главным призом или отказ от него |
| API | `GET /api/health`; `/api/auth/login`, `/logout`, `/me`; заявки: `GET` / `POST` / `DELETE /api/registrations` (удаление только после входа админа) |
| Админка `/admin` | Сессия по cookie, таблица заявок с автообновлением, экспорт в **Excel**, очистка базы |
| UI админа | После входа скрывается шапка DTEL; сверху справа — только кнопка **Выход** |
| Номера розыгрыша | Назначаются **на сервере**, формат `XXX-XXX`; в MySQL уникальный индекс, коллизии обрабатываются повторной генерацией |
| Данные | Заявки и пароли админа в MySQL; тестовые заявки в репозиторий не входят |

## Стек

| Слой | Технологии |
|------|------------|
| Клиент | Vue 3, Vue Router, Vite 8, SheetJS (`xlsx`) для экспорта |
| Сервер | Node.js ESM, `mysql2`, сессии в памяти, хеш пароля (scrypt) |
| Инфраструктура | Docker multi-stage, MySQL 8, Compose |

Версия релиза в `package.json`: **1.0.0**.

## Требования

- **Docker Desktop** (Compose V2)
- Для локальной сборки фронта без Docker: **Node.js 20+** (рекомендуется 22)

## Первый запуск из Git

1. Клонировать репозиторий:

   ```bash
   git clone https://github.com/matos85/phishing-literacy-test.git
   cd phishing-literacy-test
   ```

2. Создать файл с логином и паролем администратора (он **не** коммитится):

   ```bash
   cp admin-credentials.example.env admin-credentials.env
   ```

   В Windows PowerShell:

   ```powershell
   Copy-Item admin-credentials.example.env admin-credentials.env
   ```

3. Отредактировать `admin-credentials.env`: задайте `ADMIN_LOGIN` и `ADMIN_PASSWORD` для первичного создания пользователя в БД при старте контейнера.

4. Запустить стек:

   ```bash
   docker compose up --build -d
   ```

5. Открыть в браузере: **http://localhost:8080**  
   Админка: **http://localhost:8080/admin**

При первом старте выполняются ожидание MySQL, миграции, создание администратора из `admin-credentials.env` (если записей ещё нет) и подъём HTTP-сервера.

### Важно про пароль администратора

Пароль задаётся при **первом** появлении записи администратора в базе. Если позже изменить только `admin-credentials.env`, уже созданный пользователь **не** обновится автоматически — нужно сменить пароль в БД вручную или удалить строку из таблицы `admins` и пересоздать контейнер/данные (осторожно с продакшеном).

## Файл учётных данных администратора

| Файл | Назначение |
|------|------------|
| `admin-credentials.example.env` | Шаблон в репозитории; можно менять значения по умолчанию для новых развёртываний. |
| `admin-credentials.env` | **Ваши** логин и пароль на сервере. Файл перечислен в `.gitignore` и не попадает в Git. |

Переменные:

- `ADMIN_LOGIN` — логин входа в админку.
- `ADMIN_PASSWORD` — пароль (избегайте пробелов в начале/конце; спецсимволы допустимы).

Docker Compose подключает `admin-credentials.env` к сервису `app` через `env_file`. Другие переменные (`DATABASE_URL`, `PORT`) задаются в `docker-compose.yml`.

## Команды Docker

```bash
docker compose up --build -d    # сборка и запуск в фоне
docker compose logs -f app      # логи приложения
docker compose down             # остановка
docker compose down -v          # остановка и удаление тома MySQL (полная очистка данных)
```

Порты по умолчанию: приложение **8080 → 3000**, MySQL **3306**.

## Локальная разработка (без Docker)

```bash
npm ci
npm run dev
```

Для API нужен MySQL и переменные окружения. Удобно экспортировать те же значения, что и в `admin-credentials.env`, и при необходимости `DATABASE_URL` / `MYSQL_*` (см. `server/db.mjs`).

Запуск только бэкенда после сборки фронта:

```bash
npm run build
# задать ADMIN_LOGIN, ADMIN_PASSWORD и доступ к БД в окружении
npm run start
```

В режиме `npm run dev` Vite проксирует `/api` на `http://127.0.0.1:3000` (см. `vite.config.js`).

## Структура проекта

```
server/                  # HTTP API, миграции MySQL, ожидание БД, seed только админа
src/
  components/          # AppHeader, AdminSessionBar, HeroSlideshow
  composables/         # useAdminSession — флаг входа админа для шапки
  lib/                 # apiAdmin, apiRegistration, clientMeta
  views/               # главная, регистрация, завершение, админка
public/                # favicon, иллюстрации hero
dist/                  # сборка Vite (не в Git)
Dockerfile
docker-compose.yml
admin-credentials.example.env
.env.example
```

## После `git clone`

| Задача | Что восстанавливается |
|--------|------------------------|
| Запуск в Docker | `Dockerfile` собирает фронт (`npm run build` внутри образа), локальный `dist/` не обязателен |
| Зависимости Node | `package.json` + `package-lock.json` → `npm ci` |
| Секреты админа | Шаблон `admin-credentials.example.env` → скопировать в `admin-credentials.env` |
| Статика и исходники | `public/`, `src/`, `server/`, `index.html`, `vite.config.js` |

Шаблон переменных для локального запуска без Docker: `.env.example`.

## Лицензия и использование

Проект предназначен для обучения осознанности в отношении фишинга. Используйте только в законных сценариях и с согласием участников.
