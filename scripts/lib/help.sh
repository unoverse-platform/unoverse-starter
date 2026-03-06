#!/usr/bin/env bash
# gravity help

cmd_help() {
  echo ""
  echo -e "  ${BOLD}${CYAN}⬡ Gravity Platform CLI${NC} ${DIM}v${GRAVITY_VERSION}${NC}"
  echo ""
  echo -e "  ${BOLD}Setup${NC}"
  echo -e "    ${GREEN}init${NC}        Interactive setup wizard"
  echo -e "    ${GREEN}doctor${NC}      Diagnose environment issues"
  echo ""
  echo -e "  ${BOLD}Platform${NC}"
  echo -e "    ${GREEN}start${NC}       Start all services"
  echo -e "    ${GREEN}stop${NC}        Stop all services"
  echo -e "    ${GREEN}status${NC}      Show service health"
  echo -e "    ${GREEN}check${NC}       Run full health check"
  echo -e "    ${GREEN}logs${NC}        Stream logs ${DIM}(./gravity logs <service>)${NC}"
  echo -e "    ${GREEN}update${NC}      Pull latest images and restart"
  echo -e "    ${GREEN}open${NC}        Open Canvas in browser ${DIM}(./gravity open grafana)${NC}"
  echo ""
  echo -e "  ${BOLD}Development${NC}"
  echo -e "    ${GREEN}dev${NC}         Install deps, gen nodes, start platform"
  echo -e "    ${GREEN}db-setup${NC}    Run database migrations ${DIM}(safe to re-run)${NC}"
  echo -e "    ${GREEN}db-verify${NC}   Verify database schema against Prisma"
  echo -e "    ${GREEN}build${NC}       Build and restart ${DIM}(./gravity build <package>)${NC}"
  echo -e "    ${GREEN}gendesign${NC}   Generate design system nodes + restart"
  echo ""
}
