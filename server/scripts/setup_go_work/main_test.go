// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package main

import (
	"errors"
	"reflect"
	"testing"
)

func recordRuns(calls *[][]string, failOn string) func(...string) error {
	return func(args ...string) error {
		*calls = append(*calls, args)
		if len(args) > 1 && args[1] == failOn {
			return errors.New("failed")
		}
		return nil
	}
}

func TestSetupGoWorkCreatesMissingFile(t *testing.T) {
	var calls [][]string
	err := setupGoWork(func(string) (bool, error) { return false, nil }, recordRuns(&calls, ""))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	want := [][]string{{"work", "init"}, {"work", "use", ".", "./public"}}
	if !reflect.DeepEqual(calls, want) {
		t.Fatalf("calls = %v, want %v", calls, want)
	}
}

func TestSetupGoWorkKeepsExistingFile(t *testing.T) {
	var calls [][]string
	err := setupGoWork(func(string) (bool, error) { return true, nil }, recordRuns(&calls, ""))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	want := [][]string{{"work", "use", ".", "./public"}}
	if !reflect.DeepEqual(calls, want) {
		t.Fatalf("calls = %v, want %v", calls, want)
	}
}

func TestSetupGoWorkStopsWhenInitFails(t *testing.T) {
	var calls [][]string
	err := setupGoWork(func(string) (bool, error) { return false, nil }, recordRuns(&calls, "init"))
	if err == nil {
		t.Fatal("expected an error")
	}
	if len(calls) != 1 {
		t.Fatalf("calls = %v, want only the init call", calls)
	}
}

func TestSetupGoWorkReportsStatError(t *testing.T) {
	var calls [][]string
	err := setupGoWork(func(string) (bool, error) { return false, errors.New("denied") }, recordRuns(&calls, ""))
	if err == nil {
		t.Fatal("expected an error")
	}
	if len(calls) != 0 {
		t.Fatalf("calls = %v, want none", calls)
	}
}
