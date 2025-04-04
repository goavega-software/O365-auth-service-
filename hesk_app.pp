class hesk_app {

  package { 'git':
    ensure => latest,
  } 
 
  #------Database------
  package { 'mysql-server':
  ensure => latest,
  }

  service { 'mysql': 
  ensure  => running,
  enable  => true,
  require => Package['mysql-server'],
  }


  #------Apache-Server------
  package { 'apache2':
    ensure => latest,
  }

  exec { 'enable_mod_rewrite':
    command => 'a2enmod rewrite',
    unless  => 'test -L /etc/apache2/mods-enabled/rewrite.load',
    require => Package['apache2'],
  }

  service { 'apache2':
    ensure => running,
    enable => true,
    subscribe => Package['apache2'],
  }

  #------PHP------
  package { 'php':
    ensure => latest,
  }

 package { ['php-mbstring', 'php-curl', 'php-zip', 'php-gd', 'php-mysql']:
    ensure  => latest,
    require => Package['php'],
  }


  file { '/var/www/html':
    ensure => directory,
    owner  => 'www-data',
    group  => 'www-data',
    mode   => '0755',
  }

  
  vcsrepo { '/var/www/html':
    ensure   => latest,
    provider => 'git',
    source   => 'https://github.com/goavega-software/help-desk',  
    require  => Package['git'],
  }

  # Set Permissions for Hesk Directory
  exec { 'set_hesk_permissions':
    command => 'chown -R www-data:www-data /var/www/html',
    require => Vcsrepo['/var/www/html'],
  }

  # Create Apache Virtual Host Configuration for Hesk
  file { '/etc/apache2/sites-available/hesk.conf':
    ensure  => file,
    owner   => 'root',
    group   => 'root',
    mode    => '0644',
    content => "<VirtualHost *:8080>
  ServerAdmin admin@goavega.com
  DocumentRoot /var/www/html
  ServerName goavega.com
  ServerAlias www.goavega.com
  <Directory /var/www/html>
    Options FollowSymLinks
    AllowOverride All
    Order allow,deny
    allow from all
  </Directory>
  ErrorLog /var/log/apache2/goavega.com-error_log
  CustomLog /var/log/apache2/goavega.com-access_log common
</VirtualHost>",
  }

  # Enable Apache Virtual Host
  exec { 'enable_hesk_virtualhost':
    command => 'a2ensite hesk.conf',
    unless  => 'test -L /etc/apache2/sites-enabled/hesk.conf',
    require => File['/etc/apache2/sites-available/hesk.conf'],
  }

  # Restart Apache After Enabling Virtual Host
  exec { 'restart_apache':
    command => 'service apache2 restart',
    require => Exec['enable_hesk_virtualhost'],
  }
}

include hesk_app
