FROM debian:trixie

ARG TARGETARCH

RUN apt-get update && apt-get -y upgrade

RUN DEBIAN_FRONTEND=noninteractive apt-get install -y \
	curl \
	git \
	doas \
	locales \
	gnupg \
	zsh \
	apt-transport-https \
	ca-certificates \
	lsb-release

RUN <<-EOF
	set -eux

	dpkg-reconfigure -f noninteractive tzdata

	sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen
	echo 'LANG="en_US.UTF-8"' > /etc/default/locale
	dpkg-reconfigure --frontend=noninteractive locales
	update-locale LANG=en_US.UTF-8
	EOF

RUN <<-EOF
	set -eux

	install -m 0755 -d /etc/apt/keyrings
	curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
	chmod a+r /etc/apt/keyrings/docker.asc

	tee /etc/apt/sources.list.d/docker.sources <<-EOS
	Types: deb
	URIs: https://download.docker.com/linux/debian
	Suites: $(. /etc/os-release && echo "$VERSION_CODENAME")
	Components: stable
	Signed-By: /etc/apt/keyrings/docker.asc
	EOS

	apt update

	apt install -y docker-ce-cli docker-buildx-plugin docker-compose-plugin
	EOF


RUN apt-get -y install \
	rcm tmux neovim iputils-ping procps

ARG USERNAME=dev
ARG HOST_UID=1000
RUN <<-EOF
	set -eux

	useradd -s /bin/zsh -m -u ${HOST_UID} ${USERNAME}
	echo "permit nopass ${USERNAME} as root" > /etc/doas.conf

	groupadd docker
	usermod -aG docker ${USERNAME}
	EOF

USER ${USERNAME}
ENV HOME="/home/${USERNAME}"
SHELL ["/bin/zsh", "-ic"]
WORKDIR ${HOME}


ARG DOTFILES_REPO="https://github.com/datarockets/dotfiles.git"
ARG DOTFILES_INSTALL_COMMAND="RCRC=${HOME}/.dotfiles/rcrc rcup"
RUN <<-EOF
	set -eux
	git clone $DOTFILES_REPO ~/.dotfiles
	eval "${DOTFILES_INSTALL_COMMAND}"

	echo -e "[[ -f ~/.zshrc.devcontainer ]] && source ~/.zshrc.devcontainer"  \
		> ~/.zshrc.local

	echo -e 'export PS1="[dev] ${PS1}"' >> ${HOME}/.zshrc.devcontainer

	mkdir -p ${HOME}/.bin
	echo -e 'export PATH="${HOME}/.bin:${HOME}/.local/bin:${PATH}"' >> ${HOME}/.zshrc.devcontainer
	EOF


ARG ASDF_VERSION="v0.18.0"
ARG NODE_VERSION="24.12.0"
RUN <<-EOF
	set -eux

	mkdir -p ${HOME}/.bin
	curl -fsSL https://github.com/asdf-vm/asdf/releases/download/${ASDF_VERSION}/asdf-${ASDF_VERSION}-linux-${TARGETARCH}.tar.gz \
		| tar -xz -C ${HOME}/.bin

	echo -e 'export PATH="${HOME}/.asdf/shims:${PATH}"' >> ${HOME}/.zshrc.devcontainer

	asdf plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git

	asdf install nodejs ${NODE_VERSION}
	EOF

RUN <<-EOF
	set -eux

	echo -e 'alias sudo="doas"' >> ${HOME}/.zshrc.devcontainer

	asdf set -u nodejs ${NODE_VERSION}

	mkdir -p ${HOME}/action/node_modules

	mkdir -p ${HOME}/.claude
	echo '{}' > ${HOME}/.claude/.claude.json
	ln -s ${HOME}/.claude/.claude.json ${HOME}/.claude.json
	npm install -g @anthropic-ai/claude-code

	mkdir -p ${HOME}/.local
	npm install -g @sourcegraph/amp
	EOF

COPY .devcontainer/entrypoint.sh /usr/local/bin/entrypoint.sh

ENTRYPOINT ["entrypoint.sh"]
CMD ["sleep", "infinity"]
