class node_app {
  package { 'nodejs':
    ensure => latest,
  }

  package { 'git':
    ensure => latest,
  }

  file { '/var/www/sso-server':
    ensure  => directory,
    owner   => 'ec2-user',
    group   => 'ec2-user',
    mode    => '0755',
  }

  vcsrepo { '/var/www/sso-server':
    ensure   => latest,
    provider => 'git',
    source   => 'https://github.com/goavega-software/office365-auth-service.git',
    require  => Package['git'],
  }

  exec { 'install_npm_packages':
    command => 'npm install',
    cwd     => '/var/www/sso-server',
    require => Package['nodejs'],
  }

  exec { 'install_pm2':
    command => 'npm install -g pm2',
    require => Package['nodejs'],
  }
# check if pm2 start will work even after reboot
  exec { 'start_node_app':
    command => 'pm2 start server.js',
    cwd     => '/var/www/sso-server',
    require => [Exec['install_npm_packages'], Exec['install_pm2']],
  }
# in puppet how do we get secrets and set as environment variables
}

include node_app
