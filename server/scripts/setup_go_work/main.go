// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// setup_go_work prepares the go.work file of the server directory, the same way
// `make setup-go-work` does: a workspace that uses the server module and the local
// ./public module. Unlike `go work init` it can be run again: an existing go.work is
// kept and only made to use both modules.
//
// Run it from the server directory: go run ./scripts/setup_go_work
package main

import (
	"errors"
	"fmt"
	"io/fs"
	"os"
	"os/exec"
)

const workFile = "go.work"

var workModules = []string{".", "./public"}

// goCommand runs the go tool with the given arguments, passing its output through.
func goCommand(args ...string) error {
	cmd := exec.Command("go", args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("go %v: %w", args, err)
	}
	return nil
}

// setupGoWork creates go.work when it is missing and makes it use workModules.
func setupGoWork(exists func(string) (bool, error), run func(...string) error) error {
	found, err := exists(workFile)
	if err != nil {
		return err
	}
	if !found {
		if err := run("work", "init"); err != nil {
			return err
		}
	}
	return run(append([]string{"work", "use"}, workModules...)...)
}

func fileExists(name string) (bool, error) {
	_, err := os.Stat(name)
	if err == nil {
		return true, nil
	}
	if errors.Is(err, fs.ErrNotExist) {
		return false, nil
	}
	return false, fmt.Errorf("checking %s: %w", name, err)
}

func main() {
	if err := setupGoWork(fileExists, goCommand); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
