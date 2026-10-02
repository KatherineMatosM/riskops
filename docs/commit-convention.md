# Convencion de Commits — RiskOps

Este proyecto utiliza **Conventional Commits**.

## Formato

```text
<tipo>: <descripcion breve en minusculas>
```

## Tipos permitidos

```text
feat:      nueva funcionalidad
fix:       correccion de un error
docs:      cambios de documentacion
refactor:  cambio de codigo que no agrega funcionalidad ni corrige un bug
test:      agregar o modificar tests
chore:     tareas de mantenimiento (dependencias, configuracion)
style:     cambios de formato que no afectan la logica
build:     cambios que afectan el sistema de build o dependencias externas
ci:        cambios en la configuracion de integracion continua
```

## Ejemplos validos

```text
feat: add risk creation endpoint
feat: add risk evaluation service
feat: add risk dashboard
fix: validate risk probability range
test: add risk service tests
docs: update API documentation
chore: configure docker compose
ci: add backend test workflow
```

## Commits que NO deben usarse

```text
update
changes
final
final2
cosas
prueba
test
arreglos
```

## Commits pequenos y logicos

Evitar mezclar `frontend + backend + database + docker` en un mismo commit,
salvo que sea estrictamente necesario. Cada commit debe representar una unidad
logica de trabajo, por ejemplo:

```text
feat: create risk model
feat: create risk repository
feat: create risk service
feat: create risk endpoints
test: add risk endpoint tests
feat: create risk table
feat: create risk frontend page
```