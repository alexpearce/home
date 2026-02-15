{
  description = "alex.pearwin.com website";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        checks.default = self.packages.${system}.default;
        formatter = pkgs.nixfmt-tree;
        devShells = {
          default = pkgs.mkShell {
            buildInputs = [
              pkgs.nodePackages_latest.nodejs
              pkgs.nodePackages_latest.typescript-language-server
            ];
            NODE_ENV = "development";
          };
        };
        packages.default = pkgs.buildNpmPackage {
          pname = "alex-pearwin-com";
          version = "1.0.0";
          src = ./.;
          nodejs = pkgs.nodePackages_latest.nodejs;
          npmDepsHash = {
            "aarch64-darwin" = "sha256-AonZ5B/uQb04xV+TQmAjEizQmKgTs+GhZ439qQ8ce6U=";
            "x86_64-linux" = "sha256-yfks+I6oqH9oac5eieRqazr1XK/3aApH2h2hzhScIls=";
          }.${system};
          installPhase = ''
            runHook preInstall
            cp -r dist $out
            runHook postInstall
          '';
        };
      }
    );
}
