# Üretim imajı: derleme ayrı aşamada, çalışma `next start` ile.
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# postinstall (prisma generate) şema gelmeden çalışamaz; generate derleme aşamasında yapılır.
RUN npm ci --ignore-scripts

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Derleme sırasında veritabanına bağlanılmaz; adres yalnız modüllerin yüklenebilmesi için.
# Bu değer çalışma imajına geçmez, gerçek adres çalışma anında verilir.
ARG DATABASE_URL=postgresql://derleme:derleme@localhost:5432/derleme
RUN npx prisma generate && npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TZ=Europe/Istanbul
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
# next.config.ts çalışma anında da gerekir: yoksa imaj cacheComponents (PPR) ile derlenip ayar
# kapalı çalışır ve oturum okuyan her sayfa DYNAMIC_SERVER_USAGE ile 500 verir.
COPY --from=build /app/next.config.ts ./next.config.ts
# .next/cache çalışma anında yazılır: root olmayan kullanıcıya ait olmalı.
COPY --from=build --chown=app:app /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/generated ./generated
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
# Yönetim betikleri (ilk admin: npx tsx scripts/admin-olustur.ts) ve bağımlı oldukları kaynaklar.
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/lib ./lib
COPY --from=build /app/tsconfig.json ./tsconfig.json
USER app
EXPOSE 3000
# Önce bekleyen migration'lar uygulanır, sonra uygulama başlar.
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
