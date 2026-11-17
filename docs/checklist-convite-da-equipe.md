# Checklist: convidar a equipe real

Use antes e durante a entrada das pessoas no site publicado. Marque cada item.

## Antes de convidar

- [ ] SMTP próprio configurado no Supabase real (Authentication, SMTP Settings) e domínio do remetente verificado no provedor de e-mail.
- [ ] Teste de e-mail: cadastro com um e-mail externo recebe o link de confirmação (conferir spam) e o link abre o site publicado, não `localhost`.
- [ ] Site URL do Supabase aponta para o site publicado (já conferido em 2026-11-17).
- [ ] Banco real sem dados de teste (limpeza `[QA]` feita em 2026-11-17).
- [ ] Exportação local do banco feita no dia (plano gratuito não tem backup).
- [ ] Lista da equipe pronta: nome, e-mail, área e perfil de cada pessoa (administrador, coordenação ou membro; freelancers com área "Freelancer").

## Convidar

1. Entre com uma conta de administrador ou coordenação e abra "Equipe e piloto".
2. Para cada pessoa, crie o convite com o e-mail exato, nome, área e perfil. Só administrador convida administrador.
3. Avise a pessoa para usar "Primeiro acesso? Criar minha conta" com **o mesmo e-mail** do convite e confirmar pelo link recebido.
4. Convide em lotes pequenos no começo (3 a 5 pessoas), para pegar problema de entrega de e-mail cedo.

## Depois de cada lote

- [ ] Em "Equipe e piloto", o convite aparece como "Já entrou".
- [ ] A pessoa vê o perfil e as telas certas para o papel dela.
- [ ] Quem não recebeu o e-mail: conferir spam, o e-mail do convite e o painel do Provedor de e-mail; remover e refazer o convite se o endereço estava errado.

## Depois que todos entraram

- [ ] Criar as equipes reutilizáveis (menu Equipes) e os projetos reais.
- [ ] Combinar com o grupo onde registrar bugs (botão de relato dentro do app).
