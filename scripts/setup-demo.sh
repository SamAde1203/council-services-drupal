#!/usr/bin/env bash
#
# Installs the Demo City Council site with the Bin Day Finder module and the
# Civic theme. Used by `ddev setup-demo` and by the CI accessibility job.
#
# Environment variables:
#   DRUSH   Drush command to use (default: drush).
#   DB_URL  Database URL, only needed outside DDEV
#           (for example sqlite://localhost/sites/default/files/.ht.sqlite).

set -euo pipefail

DRUSH="${DRUSH:-drush}"
DB_ARGS=()
if [[ -n "${DB_URL:-}" ]]; then
  DB_ARGS=(--db-url="${DB_URL}")
fi

echo "Installing Drupal (standard profile)..."
$DRUSH site:install standard -y "${DB_ARGS[@]}" \
  --site-name="Demo City Council" \
  --account-name=admin \
  --account-pass=admin

echo "Enabling modules..."
$DRUSH pm:install inline_form_errors bin_day_finder -y

echo "Enabling and setting the Civic theme..."
$DRUSH theme:install civic -y
$DRUSH config:set system.theme default civic -y

echo "Creating a welcome page..."
NID=$($DRUSH php:eval '
  $node = \Drupal\node\Entity\Node::create([
    "type" => "page",
    "title" => "Welcome to Demo City Council",
    "body" => [
      "value" => "<p>Find information and use online services from Demo City Council.</p><h2>Popular services</h2><ul><li><a href=\"/bin-day\">Find your bin collection day</a></li></ul>",
      "format" => "basic_html",
    ],
  ]);
  $node->save();
  echo $node->id();
')
$DRUSH config:set system.site page.front "/node/${NID}" -y

$DRUSH cache:rebuild
echo "Done."
