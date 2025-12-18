FROM node:24-trixie

ARG HOST_UID
# this is needed to avoid permission issues when mounting volumes
RUN usermod -u ${HOST_UID} node

USER node
SHELL ["/bin/bash", "-c"]
WORKDIR /home/node/action

RUN <<-EOF
	# make sure node_modules is owned by node user so mounting of volumes
	# works without permission issues on macOS
	mkdir -p /home/node/action/node_modules

	# ~/.is_container helps to detect if we are in a container in scripts
	touch /home/node/.is_container
	EOF
