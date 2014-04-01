#!/usr/bin/perl

my $host = "http://2048.semantics3.com/hi/";

#--Start game
my $cmd = "curl --silent -L $host"."start";
my $output = `$cmd`;
my $session_id = $output;
$session_id=~s/.*?ID:\s(\w+).*/$1/si;
my %keyMap = ( 'w' => 0, 'd' => 1, 's' => 2, 'a' => 3);
print STDERR $output,"\n";
while(1) {
    print STDERR "Input:\n";
    my $userInput =  <STDIN>;
    chomp ($userInput);
    if(defined($keyMap{$userInput})) {
        $userInput = $keyMap{$userInput};
    }
    else {
        print STDERR "Invalid move.. w - up, a - left, d - right, s - down\n";
        next;
    }
    my $cmd = "curl --silent $host"."state/$session_id/move/$userInput";
    my $output = `$cmd`;
    print STDERR "\n$output\n";
    if($output=~/Message:/si) {
        exit(0);
    }
}
