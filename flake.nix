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
      }
    );
}
