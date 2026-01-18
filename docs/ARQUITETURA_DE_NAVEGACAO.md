
# 🧭 Arquitetura de Navegação e Sidebars

Este documento descreve como o menu lateral (Sidebar) e a navegação funcionam no projeto SaaS Tirilo. **Leia isto antes de tentar modificar os menus.**

## 🚨 Problema Comum (Gotchas)

> **ATENÇÃO:** Existem **dois** sistemas de Sidebar coexistindo. Editar um pode não afetar o outro dependendo da rota que o usuário está acessando.

1.  **Se o usuário está em `/admin/...`:** Ele vê o **Sidebar Principal**.
2.  **Se o usuário está em `/clinica/[id]/...`:** Ele vê o **ClinicSidebar (Legado)**.

**Onde editar os links?**
*   Para adicionar links no painel administrativo principal (que inclui visão de Clínica, Recepção, Terapeutas acessadas via `/admin/`): Edite **`lib/nav-config.tsx`**.
*   Para adicionar links no painel específico de rotas legado (`/clinica/[id]`): Edite **`components/ClinicSidebar.tsx`**.

---

## 1. Sidebar Principal (Moderno)
**Arquivo do Componente:** `components/Sidebar.tsx`
**Arquivo de Configuração:** `lib/nav-config.tsx`
**Rotas:** Todas iniciadas em `/admin/*` (ex: `/admin/clinicas`, `/admin/recepcao`, `/admin/robo`).

Este é o sidebar dinâmico e preferencial. Ele decide quais links mostrar baseado em:
1.  **Perfil do Usuário:** Admin, Terapeuta, Recepção.
2.  **Contexto:** Se uma clínica está carregada ou se é visão Global.

### Como Adicionar um Link:
Não edite o `components/Sidebar.tsx`. Vá para `lib/nav-config.tsx` e adicione o objeto na array `masterLinks` (Admin Geral) ou `clinicLinks` (Gestão da Clínica).

```typescript
// lib/nav-config.tsx
{
    href: '/admin/minha-nova-rota',
    label: 'Nome do Link',
    icon: <Icone className="w-6 h-6" />,
},
```

---

## 2. ClinicSidebar (Legado/Específico)
**Arquivo do Componente:** `components/ClinicSidebar.tsx`
**Rotas:** Iniciadas em `/clinica/[id]/*`.

Este sidebar é hardcoded e usado apenas quando se navega diretamente para o ID da clínica fora do contexto `/admin`. Ele é menos flexível e não usa `nav-config.tsx`.

---

## 3. Estrutura de Rotas
*   `/admin/loja` -> Usa Sidebar Principal. Redireciona internamente ou renderiza conteúdo baseado na clínica do usuário logado.
*   `/clinica/[id]/loja` -> Usa ClinicSidebar. Rota direta.

Recomendamos manter a consistência usando as rotas `/admin/*` sempre que possível para aproveitar o Sidebar Principal e a gestão de permissões centralizada.
