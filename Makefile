all: xpi

PACKAGE := $(shell ls -d *@* | head -1)
NAME := $(shell echo $(PACKAGE) | cut -f1 -d'@')
VERSION := $(shell grep em:version $(PACKAGE)/install.rdf | cut -f2 -d'"' | cut -f2 -d'>' | cut -f1 -d'<')

xpi:
	@echo Creating XPI for $(NAME) version ${VERSION}
	cd $(PACKAGE) && zip -q -9 -r ../$(NAME)-${VERSION}.xpi * -x \*/.\*

clean:
	@echo $(RM) *.xpi
	@[ -e *.xpi ] && $(RM) *.xpi || true
